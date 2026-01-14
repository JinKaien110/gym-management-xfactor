import { ObjectId } from "mongodb";
import { connectDB } from "../config/db.js";
import { ValidationError } from "../errors/ValidationError.js";

class ClassModel {
    async createClass(data) {
        const db = await connectDB();

        const result = await db.collection("classes").insertOne(data);

        if(!result || !result.acknowledged) {
            throw new ValidationError("Failed to create class");
        }

        return result;
    }

    async viewClassByName(name) {
        const db = await connectDB();

        return await db.collection("classes").findOne({      name: name,
            active: { $ne: "archived" }
        });
    }

    async viewClass(id) {
        const db = await connectDB();

        const result = await db.collection("classes").findOne({ _id: id });

        if(!result) {
            throw new ValidationError("Failed to view class");
        }

        return result;
    }

    async viewAllClass(filter, page, limit) {
        const db = await connectDB();
        const skip = (page - 1) * limit

        const result = await db.collection("classes").aggregate([
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
            { $sort: { statusPriority: 1, createdAt: -1} },
            { $skip: skip },
            { $limit: limit } 
        ]).toArray();

        const total = await db.collection("classes").countDocuments(filter);

        if(!result.length) {
            return {
                page,
                limit,
                result: [],
                total: 0,
                totalPages: 0
            }
        }

        return {
            page,
            limit,
            result,
            total,
            totalPages: Math.ceil(total / limit)
        }
    }

    async updateClass(id, data) {
        const db = await connectDB();

        const result = await db.collection("classes").findOneAndUpdate(
            { _id: id },
            { $set: data },
            { returnDocument: "after" } 
        );

        if(!result) {
            throw new ValidationError("Failed to update class");
        }

        return result;
    }

    async updateClassStatus(id, data) {
        const db = await connectDB();

        const result = await db.collection("classes").findOneAndUpdate(
            { _id: id },
            { $set: data },
            { returnDocument: "after" } 
        );

        if(!result) {
            throw new ValidationError("Failed to update class status");
        }

        return result;
    }
}

export default new ClassModel();