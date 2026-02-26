import { ObjectId } from "mongodb";
import { connectDB } from "../config/db.js";
import { ValidationError } from "../errors/ValidationError.js";

class PaymentModel {
    async createPayment(data) {
        const { db } = await connectDB();

        const result = await db.collection("payments").insertOne(data);

        if(!result || !result.acknowledged) {
            throw new ValidationError("Failed to create payments");
        }

        return result;
    }

    async updateStatusByExternalID(id, data) {
        const { db } = await connectDB();

        const result = await db.collection("payments").updateOne(
            { external_id: id },
            { $set: data }
        );

        if(!result) {
            throw new ValidationError("Failed to update the status in payments");
        }

        return result
    }

    async findByExternalID(id) {
        const { db } = await connectDB();

        const result = await db.collection("payments").findOne({ external_id: id });

        if(!result) {
            throw new ValidationError("Failed to update the status in payments");
        }

        return result
    }

    async getAllPayment(filter, search, page, limit) {
        const { db } = await connectDB();
        page = Number(page);
        limit = Number(limit);
        const skip = (page - 1) * limit;



        const pipeline = [
            { $match: filter },
            {
                $addFields: {
                    statusPriority: {
                        $switch: {
                            branches: [
                                { case: { $eq: ["$status", "PENDING"] }, then: 1 },
                                { case: { $eq: ["$status", "PAID"] }, then: 2 },
                                { case: { $eq: ["$status", "FAILED"] }, then: 3 }
                            ],
                            default: 4
                        }
                    }
                }
            },
            { $sort: { statusPriority: 1, createdAt: -1} },
            {
                $lookup: {
                    from: "memberships_request",
                    localField: "membership_request_id",
                    foreignField: "_id",
                    as: "request"
                }
            },
            { $unwind: 
                { path: "$request", preserveNullAndEmptyArrays: true
                } 
            },
            {
                $lookup: {
                    from: "members",
                    localField: "request.member_id",
                    foreignField: "_id",
                    as: "member"
                }
            },
            {
                $unwind: {
                    path: "$member",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    _id: 1,
                    date: "$createdAt",
                    first_name: "$member.first_name",
                    last_name: "$member.last_name",
                    payment_method: "$payment_method",
                    type: "$request.type",
                    amount: 1,
                    status: 1,
                    external_id: 1
                }
            },

            { $skip: skip },
            { $limit: limit }
        ];

        if(search) {
            pipeline.unshift({
                $match: {
                    $or: [
                        { "member.first_name": { $regex: search, $options: "i" } },
                        { "member.last_name": { $regex: search, $options: "i" } }
                    ]
                }
            });
        }

        const result = await db.collection("payments").aggregate(pipeline).toArray();
        const total = await db.collection("payments").countDocuments(filter);

        return {
            result,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    }

    async getPaymentDetails(id) {
        const { db } = await connectDB();

        const pipeline = [
            { $match: { _id: id } },
            {
                $lookup: {
                    from: "memberships_request",
                    localField: "membership_request_id",
                    foreignField: "_id",
                    as: "request"
                }
            },
            { $unwind: { path: "$request", preserveNullAndEmptyArrays: true } 
            },
            {
                $lookup: {
                    from: "members",
                    localField: "request.member_id",
                    foreignField: "_id",
                    as: "member"
                }
            },
            {
                $unwind: { path: "$member", preserveNullAndEmptyArrays: true }
            },
            {
                $project: {
                    _id: 1,
                    member_id: "$member._id",
                    first_name: "$member.first_name",
                    last_name: "$member.last_name",
                    email: "$member.email",
                    plan_id: "$request.plan_id",
                    pricing_id: "$request.pricing_id",
                    date: "$createdAt",
                    amount: 1,
                    status: 1,
                    payment_method: 1,
                    type: "$request.type",
                    raw_response: 1
                }
            }
        ];
        
        const result = await db.collection("payments").aggregate(pipeline).toArray();

        return result[0] || null;
    }

    async getTotalRevenue(filter) {
        const { db } = await connectDB();

        const result = await db.collection("payments").aggregate([
            { $match: filter },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]).toArray();

        return {
            totalRevenue: result[0]?.total || 0
        };
    }
    
}

export default new PaymentModel();