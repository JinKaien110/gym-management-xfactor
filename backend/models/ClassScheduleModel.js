import { ObjectId } from "mongodb";
import { connectDB } from "../config/db.js";
import { ValidationError } from "../errors/ValidationError.js";


class ClassScheduleModel {
    async createClassSchedule(data) {
        const db = await connectDB();

        const result = await db.collection("class_schedule").insertOne(data);

        if(!result || !result.acknowledged) {
            throw new ValidationError("Failed to create class schedule");
        }

        return result;
    }

    async checkScheduleIfAlreadyExist(id, start_at) {
        const db = await connectDB();

        const result = await db.collection("class_schedule").findOne({
            class_id: id,
            start_at: start_at,
            status: "open"
        });

        return result;
    }

    async viewClassSchedule(id) {
        const db = await connectDB();

        const result = await db.collection("class_schedule").findOne(id);

        if(!result) {
            throw new ValidationError("No class schedule found");
        }

        return result;
    }
    
    async viewAllClassSchedule(filter, page, limit) {
        const db = await connectDB();
        const skip = (page - 1) * limit;

        const result = await db.collection("class_schedule").aggregate([
            { $match: filter },
            {
                $addFields: {
                    statusPriority: {
                        $switch: {
                            branches: [
                                { case: { $eq: ["$status", "open"] }, then: 1 },
                                { case: { $eq: ["$status", "closed"] }, then: 2 },
                                { case: { $eq: ["$status", "cancelled"] }, then: 3 },
                                { case: { $eq: ["$status", "archived"] }, then: 4 },
                            ],
                            default: 5
                        }
                    }
                }
            },
            { $sort: { statusPriority: 1, createdAt: -1 } },
            { $skip: skip },
            { $limit: limit }
        ]).toArray();

        const total = await db.collection("class_schedule").countDocuments(filter);

        if(!result.length) {
            return {
                result: [],
                total: 0,
                page,
                limit,
                totalPages: 0
            }
        }

        return {
            result,
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    }
    
    async updateClassSchedule(id, data) {
        const db = await connectDB();

        const result = await db.collection("class_schedule").findOneAndUpdate(
            { _id: id },
            { $set: data },
            { returnDocument: "after" }
        );

        if(!result) {
            throw new ValidationError("Failed to update class schedule");
        }

        return result;
    }

    async updateClassScheduleStatus(id, data) {
        const db = await connectDB();

        const result = await db.collection("class_schedule").findOneAndUpdate(
            { _id: id },
            { $set: data },
            { returnDocument: "after" }
        );

        if(!result) {
            throw new ValidationError("Failed to update class schedule status");
        }

        return result;
    }

    async viewClassScheduleAssignedToMe(id, page, limit) {
        const db = await connectDB();

        const skip = (page - 1) * limit;
        const result = await db.collection("class_schedule")
        .find({ trainer_id: id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();

        const total = await db.collection("class_schedule").countDocuments({trainer_id: id});

        if(result.length === 0) {
            return {
                result: [],
                page,
                limit,
                total: 0,
                totalPages: 0
            }
        }
        
        return {
            result,
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    }
}

export default new ClassScheduleModel();