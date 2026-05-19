import { connectDB } from "../config/db.js";
import { ValidationError } from "../errors/ValidationError.js";



class MembershipConfigModel {
    async find(id) {
        const { db } = await connectDB();

        const result = await db.collection("membership_config").findOne({ _id: id });

        return result;
    }

    async count() {
        const { db } = await connectDB();

        const result = await db.collection("membership_config").countDocuments();

        return result; 
    }

    async create(data) {
        const { db } = await connectDB();

        const result = await db.collection("membership_config").insertOne(data);

        if(!result) throw new ValidationError("Failed to create membership config");

        return result; 
    }

    async edit(id, data) {
        const { db } = await connectDB();

        const result = await db.collection("membership_config").findOneAndUpdate(
            { _id: id },
            { $set: data },
            { returnDocument: "after"}
        );

        if(!result) throw new ValidationError("Failed to update membership config");

        return result; 
    }

    async getAll(filter, page, limit) {
        const { db } = await connectDB();
        const skip = (page - 1) * limit;

        const result = await db.collection("membership_config").aggregate([
            { $match: filter },
            {
                $addFields: {
                    statusPriority: {
                        $switch: {
                            branches: [
                                { case: { $eq: ["$status", "active"] }, then: 1 },
                                { case: { $eq: ["$status", "inactive"] }, then: 2 },
                                { case: { $eq: ["$status", "archived"] }, then: 3 },
                            ],
                            default: 4
                        }
                    }
                }
            },
            { $sort: { statusPriority: 1, createdAt: -1 } },
            { $skip: skip },
            { $limit: limit }
        ]).toArray();

        const total = await db.collection("membership_config").countDocuments(filter);

        if (!result.length) {
            return {
                page,
                limit,
                result: [],
                total: 0,
                totalPages: 0
            };
        }

        return {
            page,
            limit,
            result,
            total,
            totalPages: Math.ceil(total / limit)
        };
    }

    async showCurrentmembershipConfig() {
        const { db } = await connectDB();

        const result = await db.collection("membership_config").findOne({ status: "active" }, { sort: { createdAt: -1 } });
        return result;
    }

    async findActivemembershipConfigs() {
        const { db } = await connectDB();
        const result = await db.collection("membership_config").find({ status: "active" }).toArray();
        return result[0] || null;
    }
} 

export default new MembershipConfigModel();