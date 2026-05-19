import { connectDB } from "../config/db.js";
import { ObjectId } from "mongodb";
import { ValidationError } from "../errors/ValidationError.js";

class MembershipModel {
    async createmembership(data) {
        const { db } = await connectDB();

        const result = await db.collection("memberships").insertOne(data);

        if(!result || !result.acknowledged) {
            throw new ValidationError("Error inserting membership");
        }
        
        return result;
    }

    async alreadyHavemembership(id) {
        const { db } = await connectDB();

        const result = await db.collection("memberships").findOne(
            { client_id: id,
                status: "active"
             }
        );

        return result;
    }

    async viewmembership(id) {
        const { db } = await connectDB();

        const result = await db.collection("memberships").findOne(
            { _id: id }
        );

        if(!result) {
            throw new ValidationError("Failed to view membership");
        }

        return result;
    }

    async findmembershipByclientId(id) {
        const { db } = await connectDB();

        const result = await db.collection("memberships").find(
            { client_id: id }
        )
        .sort({ createdAt: -1 })
        .limit(1)
        .toArray();

        return result[0];
    }

    async findmembershipByPaymentId(id) {
        const { db } = await connectDB();

        const result = await db.collection("memberships").findOne(
            { payment_id: id }
        );

        return result;
    }

    async viewAllmembership(filter, search, page, limit) {
    const { db } = await connectDB();
    const skip = (page - 1) * limit;

    const pipeline = [
        { $match: filter },

        {
            $lookup: {
                from: "clients",
                localField: "client_id",
                foreignField: "_id",
                as: "client"
            }
        },
        { $unwind: { path: "$client", preserveNullAndEmptyArrays: true } },

        // 🔹 Search must be AFTER client lookup
        ...(search ? [{
            $match: {
                $or: [
                    { "client.first_name": { $regex: search, $options: "i" } },
                    { "client.last_name": { $regex: search, $options: "i" } }
                ]
            }
        }] : []),

        {
            $lookup: {
                from: "plans",
                localField: "plan_id",
                foreignField: "_id",
                as: "plan"
            }
        },
        { $unwind: { path: "$plan", preserveNullAndEmptyArrays: true } },

        {
            $lookup: {
                from: "pricing",
                localField: "pricing_id",
                foreignField: "_id",
                as: "price"
            }
        },
        { $unwind: { path: "$price", preserveNullAndEmptyArrays: true } },
        {
            $lookup: {
                from: "memberships_request",
                let: { membershipId: "$_id" },
                pipeline: [
                    {
                        $match: {
                            $expr: { $eq: ["$membership_id", "$$membershipId"] }
                        }
                    },
                    { $sort: { createdAt: -1 } },
                    { $limit: 1 } 
                ],
                as: "memberships_request"
            }
        },
        {
            $unwind: {
                path: "$memberships_request",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $addFields: {
                statusPriority: {
                    $switch: {
                        branches: [
                            { case: { $eq: ["$status", "active"] }, then: 1 },
                            { case: { $eq: ["$status", "expired"] }, then: 2 },
                            { case: { $eq: ["$status", "cancelled"] }, then: 3 },
                            { case: { $eq: ["$status", "archived"] }, then: 4 }
                        ],
                        default: 5
                    }
                }
            }
        },

        { $sort: { statusPriority: 1, createdAt: -1 } },

        {
            $project: {
                _id: 1,
                client: {
                    first_name: "$client.first_name",
                    last_name: "$client.last_name",
                    email: "$client.email"
                },
                plan: {
                    label: "$plan.label",
                    duration_days: "$plan.duration_days",
                    duration: "$plan.duration"
                },
                price: {
                    type: "$price.type",
                    price: "$price.price",
                    membership_fee: "$price.membership_fee"
                },
                start_date: 1,
                end_date: 1,
                status: 1,
                is_frozen: 1,
                createdAt: 1,
                frozen_from: 1,
                frozen_til: 1,
                memberships_request: {
                    medical_proof_url: "$memberships_request.medical_proof_url"
                }
                
            }
        },

        { $skip: skip },
        { $limit: limit }
    ];

    const result = await db.collection("memberships").aggregate(pipeline).toArray();

    // 🔹 Correct total count using aggregation
    const totalPipeline = pipeline.slice(0, -2); // remove skip + limit
    const totalResult = await db.collection("memberships")
        .aggregate([...totalPipeline, { $count: "count" }])
        .toArray();

    const total = totalResult[0]?.count || 0;

    return {
        result,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
    };
}

    async updatemembership(id, data, session = null) {
        const { db } = await connectDB();

        const result = await db.collection("memberships").findOneAndUpdate(
            { _id: id },
            { $set: data },
            { 
                returnDocument: "after",
                ...(session ? { session } : {})
            }
        );

        if(!result) {
            throw new ValidationError("Failed to update membership");
        }

        return result;
    }

    async updatemembershipStatus(id, data, session = null) {
        const { db } = await connectDB();

        const result = await db.collection("memberships").findOneAndUpdate(
            { _id: id },
            { $set: data },
            { 
                returnDocument: "after",
                ...(session ? { session } : {})
             }
        );

        if(!result) {
            throw new ValidationError("Failed to update membership status");
        }

        if(!result._id) {
            throw new ValidationError("membership not found");
        }

        return result;
    }

    async freezemembership(id, data) {
        const { db } = await connectDB();

        const result = await db.collection("memberships").findOneAndUpdate(
            { _id: id },
            { $set: data },
            { returnDocument: "after" }
        );

        if(!result) {
            throw new ValidationError("Failed to freeze the membership");
        }

        return result;
    }

    async unfreezemembership(id, data) {
        const { db } = await connectDB();

        const result = await db.collection("memberships").findOneAndUpdate(
            { _id: id },
            { $set: data },
            { returnDocument: "after" }
        );

        if(!result) {
            throw new ValidationError("Failed to unfreeze the membership");
        }

        return result;
    }

    async activatemembership(id, data) {
        const { db } = await connectDB();

        const result = await db.collection("memberships").findOneAndUpdate(
            { _id: id },
            { $set: data },
            { returnDocument: "after" }
        );

        if(!result) {
            throw new ValidationError("Failed to activate the membership");
        }

        return result;
    }

    async fetchMyActiveMembership(id) {
        const { db } = await connectDB();

        const result = await db.collection("memberships").findOne(
            { 
                client_id: id, 
                status: "active", 
                end_date: { $gte: new Date() } 
            }
        );

        return result;
    }

    async fetchMyLastMembership(id) {
        const { db } = await connectDB();

        const result = await db.collection("memberships").find(
            { client_id: id }
        )
        .sort({ createdAt: -1 })
        .limit(1)
        .toArray();

        return result[0];
    }

}

export default new MembershipModel()