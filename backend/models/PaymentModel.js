import { ObjectId } from "mongodb";
import { connectDB } from "../config/db.js";
import { ValidationError } from "../errors/ValidationError.js";

class PaymentModel {
    async createPayment(data, session) {
        const { db } = await connectDB();

        const result = await db.collection("payments").insertOne(
            data,
            { ...(session ? { session } : {} ) }
        );

        if(!result || !result.acknowledged) {
            throw new ValidationError("Failed to create payments");
        }

        return result;
    }

    async updatePayment(id, data) {
        const { db } = await connectDB();

        const result = await db.collection("payments").findOneAndUpdate(
            { _id: id },
            { $set: data },
            { returnDocument: "after"}
        );

        if(!result) {
            throw new ValidationError("Failed to pay payments");
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

    async getLatestPaymentDetails(id, payment_for, membership_request_id) {
        const { db } = await connectDB();

        const result = await db.collection("payments").find(
            {
                client_id: id,
                payment_for: payment_for,
                membership_request_id: membership_request_id
            },
        )
        .sort({ createdAt: -1 })
        .limit(1)
        .toArray()

        return result[0] || null;
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
                    from: "clients",
                    localField: "request.client_id",
                    foreignField: "_id",
                    as: "client"
                }
            },
            {
                $unwind: {
                    path: "$client",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    _id: 1,
                    date: "$createdAt",
                    first_name: "$client.first_name",
                    last_name: "$client.last_name",
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
                        { "client.first_name": { $regex: search, $options: "i" } },
                        { "client.last_name": { $regex: search, $options: "i" } }
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
                    from: "clients",
                    localField: "client_id",
                    foreignField: "_id",
                    as: "client"
                }
            },
            {
                $unwind: { path: "$client", preserveNullAndEmptyArrays: true }
            },
            {
                $project: {
                    _id: 1,
                    client_id: "$client._id",
                    first_name: "$client.first_name",
                    last_name: "$client.last_name",
                    email: "$client.email",
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
    
    async totalCountOfPayments() {
        const { db } = await connectDB();
        
        return await db.collection("payments").countDocuments();
    }

    async getAllMyPayments(filter, search, page, limit) {
        const { db } = await connectDB();
        page = Number(page);
        limit = Number(limit);
        const skip = (page - 1) * limit;

        const pipeline = [
            { $match: filter },
            { $sort: { createdAt: -1} },
            {
                $lookup: {
                    from: "clients",
                    localField: "client_id",
                    foreignField: "_id",
                    as: "client"
                }
            },
            { $unwind: { path: "$client", preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    _id: 1,
                    date: "$createdAt",
                    payment_method: 1,
                    payment_for: 1,
                    amount: 1,
                    status: 1,
                    external_id: 1,
                    reference_no: 1,
                    client: {
                        _id: "$client._id",
                        first_name: "$client.first_name",
                        last_name: "$client.last_name",
                        email: "$client.email",
                        phone: "$client.phone"
                    }
                }
            },
            { $skip: skip },
            { $limit: limit }
        ];

        if(search) {
            pipeline.unshift({
                $match: {
                    $or: [
                        { "request.type": { $regex: search, $options: "i" } }
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
}

export default new PaymentModel();