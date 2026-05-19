import { ObjectId } from "mongodb";
import { connectDB } from "../config/db.js";
import { ValidationError } from "../errors/ValidationError.js";


class ClassScheduleModel {
    async createClassSchedule(data) {
        const { db } = await connectDB();

        const result = await db.collection("class_schedule").insertOne(data);

        if(!result || !result.acknowledged) {
            throw new ValidationError("Failed to create class schedule");
        }

        return result;
    }

    async checkScheduleIfAlreadyExist(id, start_at) {
        const { db } = await connectDB();

        const result = await db.collection("class_schedule").findOne({
            class_id: id,
            start_at: start_at,
            status: "open"
        });

        return result;
    }

    async viewClassSchedule(id) {
        const { db } = await connectDB();

        const result = await db.collection("class_schedule").findOne(id);

        if(!result) {
            throw new ValidationError("No class schedule found");
        }

        return result;
    }
    
    async viewAllClassSchedule(filter, page = 1, limit = 10) {
        const { db } = await connectDB();
        const skip = (page - 1) * limit;

        const result = await db.collection("class_schedule").aggregate([
            {
                $match: filter
            },

            // Join class details
            {
                $lookup: {
                    from: "classes",
                    localField: "class_id",
                    foreignField: "_id",
                    as: "class"
                }
            },

            // Join trainer details
            {
                $lookup: {
                    from: "trainers",
                    localField: "trainer_id",
                    foreignField: "_id",
                    as: "trainer"
                }
            },

            // Join bookings
            {
                $lookup: {
                    from: "bookings",
                    let: { scheduleId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: ["$schedule_id", "$$scheduleId"]
                                },
                                // count only valid bookings
                                status: { $ne: "cancelled" }
                            }
                        }
                    ],
                    as: "bookings"
                }
            },

            {
                $unwind: {
                    path: "$trainer",
                    preserveNullAndEmptyArrays: true
                }
            },

            {
                $unwind: {
                    path: "$class",
                    preserveNullAndEmptyArrays: true
                }
            },

            // Computed fields
            {
                $addFields: {
                    joined_count: {
                        $size: "$bookings"
                    },

                    available_slots: {
                        $subtract: [
                            "$capacity",
                            { $size: "$bookings" }
                        ]
                    },

                    statusPriority: {
                        $switch: {
                            branches: [
                                {
                                    case: { $eq: ["$status", "open"] },
                                    then: 1
                                },
                                {
                                    case: { $eq: ["$status", "closed"] },
                                    then: 2
                                },
                        
                            ],
                            default: 3
                        }
                    }
                }
            },

            // Sort before project so statusPriority exists
            {
                $sort: {
                    statusPriority: 1,
                    createdAt: -1
                }
            },

            {
                $project: {
                    _id: 1,

                    class: {
                        class_id: "$class._id",
                        name: "$class.name"
                    },

                    trainer: {
                        trainer_id: "$trainer._id",
                        first_name: "$trainer.first_name",
                        last_name: "$trainer.last_name",
                        email: "$trainer.email",
                        phone: "$trainer.phone"
                    },

                    start_at: 1,
                    end_at: 1,
                    capacity: 1,
                    joined_count: 1,
                    available_slots: 1,
                    location: 1,
                    notes: 1,
                    status: 1,
                    createdAt: 1,
                    updatedAt: 1
                }
            },

            { $skip: skip },
            { $limit: limit }

        ]).toArray();


        const total = await db.collection("class_schedule")
            .countDocuments(filter);

        if (!result.length) {
            return {
                result: [],
                total: 0,
                page,
                limit,
                totalPages: 0
            };
        }

        return {
            result,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }
    
    async updateClassSchedule(id, data) {
        const { db } = await connectDB();

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
        const { db } = await connectDB();

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
        const { db } = await connectDB();

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