import { connectDB } from "../config/db.js";
import { ObjectId } from "mongodb";

class MembershipModel {
    async createMembership(data) {
        const db = await connectDB();

        const result = await db.collection("memberships").insertOne(data);

        if(!result || !result.acknowledged) {
            throw new Error("Error inserting membership");
        }
        
        return result;
    }

    async alreadyHaveMembership(id) {
        const db = await connectDB();

        const result = await db.collection("memberships").findOne(
            { member_id: id,
                status: "active"
             }
        );

        return result;
    }

    async viewMembership(id) {
        const db = await connectDB();

        const result = await db.collection("memberships").findOne(
            { _id: id }
        );

        if(!result) {
            throw new Error("Failed to view membership");
        }

        return result;
    }

    async viewAllMembership(filter, search, page, limit) {
        const db = await connectDB();
        const skip = (page - 1) * limit;

        const pipeline = [
            { $match: filter },
            {
                $addFields: {
                    statusPriority: {
                        $switch: {
                            branches: [
                                { case: { $eq: ["$status", "active"] }, then: 1 },
                                { case: { $eq: ["$status", "expired"] }, then: 2 },
                                { case: { $eq: ["$status", "cancelled"] }, then: 3 },
                                { case: { $eq: ["$status", "archived"] }, then: 4 },
                            ],
                            default: 4
                        }
                    }
                }
            },
            { $sort: { statusPriority: 1, createdAt: -1} },
            {
                $lookup: {
                    from: "members",
                    localField: "member_id",
                    foreignField: "_id",
                    as: "member"
                }
            },
            { $unwind: { path: "$member",
                preserveNullAndEmptyArrays: true
                }
            },
             {
                $lookup: {
                    from: "plans",
                    localField: "plan_id",
                    foreignField: "_id",
                    as: "plan"
                }
            },
            { $unwind: { path: "$plan",
                preserveNullAndEmptyArrays: true
                }
            },
             {
                $lookup: {
                    from: "pricing",
                    localField: "pricing_id",
                    foreignField: "_id",
                    as: "price"
                }
            },
            { $unwind: { path: "$price",
                preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    _id: 1,
                    first_name: "$member.first_name",
                    last_name: "$member.last_name",
                    plan_name: "$plan.label",
                    price_name: "$price.label",
                    start_date: 1,
                    end_date: 1,
                    status: 1,
                    is_frozen: 1,
                    frozen_at: 1,
                    createdAt: 1
                }
            },
            { $skip: skip },
            { $limit: limit }
        ];

        if(search) {
            pipeline.push({ 
                $match: { 
                    $or: [
                        {"member.first_name": { $regex: search, $options: "i" } },
                        {"member.last_name": { $regex: search, $options: "i" } }
                    ] 
                }
            });
        }

        const result = await db.collection("memberships").aggregate(pipeline).toArray();

        const total = await db.collection("memberships").countDocuments(filter);

        return {
            result,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    }

    async updateMembership(id, data) {
        const db = await connectDB();

        const result = await db.collection("memberships").findOneAndUpdate(
            { _id: id },
            { $set: data },
            { returnDocument: "after"}
        );

        if(!result) {
            throw new Error("Failed to update membership");
        }

        return result;
    }

    async updateMembershipStatus(id, data) {
        const db = await connectDB();

        const result = await db.collection("memberships").findOneAndUpdate(
            { _id: id },
            { $set: data },
            { returnDocument: "after" }
        );

        if(!result) {
            throw new Error("Failed to update membership status");
        }

        if(!result._id) {
            throw new Error("Membership not found");
        }

        return result;
    }

    async freezeMembership(id, data) {
        const db = await connectDB();

        const result = await db.collection("memberships").findOneAndUpdate(
            { _id: id },
            { $set: data },
            { returnDocument: "after" }
        );

        if(!result) {
            throw new Error("Failed to freeze the membership");
        }

        return result;
    }

    async unfreezeMembership(id, data) {
        const db = await connectDB();

        const result = await db.collection("memberships").findOneAndUpdate(
            { _id: id },
            { $set: data },
            { returnDocument: "after" }
        );

        if(!result) {
            throw new Error("Failed to unfreeze the membership");
        }

        return result;
    }
}

export default new MembershipModel()