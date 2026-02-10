import { connectDB } from "../config/db.js";
import { ObjectId } from "mongodb";
import { debuggerLog } from "../utils/debuggerLog.js";

class TrainerManagementModel {
    async createTrainer(data) {
        const { db } = await connectDB();

        const trainer = await db.collection("trainers").insertOne(data);

        if(!trainer || !trainer.acknowledged) {
            throw new Error("Failed to create new trainer");
        }

        return { 
            _id: trainer.insertedId,
            ...data
        };
    }

    async findTrainerByEmail(email) {
        const { db } = await connectDB();

        const trainer = await db.collection("trainers").findOne({email})

        return trainer;
    }

    async findTrainerById(id) {
        const { db } = await connectDB();

        const trainer = await db.collection("trainers").findOne({ _id: id })

        return trainer;
    }

    async listTrainers(filter, page, limit) {
        const { db } = await connectDB();

        const pipeline = [
            { $match: filter },
            {
                $addFields: {
                    statusPriority: {
                        $switch: {
                            branches: [
                                { case: { $eq: ["$status", "active"]}, then: 1},
                                { case: { $eq: ["$status", "inactive"]}, then: 2},
                                { case: { $eq: ["$status", "archived"]}, then: 3}
                            ],
                            default: 4
                        }
                    }
                }
            },
            { $sort: { statusPriority: 1, createdAt: -1 } },

            {
                $facet: {
                    data: [
                        { $skip: (page - 1) * limit },
                        { $limit: limit }
                    ],
                    totalCount: [
                        { $count: "count" }
                    ]
                }
            }
        ];

        const result = await db.collection("trainers").aggregate(pipeline).toArray();

        const trainers = result[0]?.data || [];
        const total = result[0]?.totalCount[0]?.count || 0;

        if(!result.length) {
            return {
                trainers: [],
                total: 0,
                page,
                limit,
                totalPages: 0
            }
        }

        return {
            trainers,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    }

    async getTrainer(id) {
        const { db } = await connectDB();
        
        const result = await db.collection("trainers").findOne(
            { _id: id },
            { projection: { password: 0 } }
        );

        if(!result) throw new Error("No trainer found");

        return result
    }

    async updateTrainerProfile(id, data) {
        const { db } = await connectDB();
        

        const result = await db.collection("trainers").findOneAndUpdate(
            { _id: id },
            { $set: data },
            { returnDocument: "after", projection: { password: 0 } }
        );

        if(!result) {
            throw new Error("Failed to update trainer profile")
        }

        return data;
    }
    
    async updateTrainerStatus(id, data) {
        const { db } = await connectDB();

        const result = await db.collection("trainers").findOneAndUpdate(
            { _id: id },
            { $set: data },
            { returnDocument: "after", projection: { password: 0 } }
        )

        if(!result) {
            throw new Error("Failed to update trainer");
        };

        return data;
    }

    async removeTrainerFromMembers(id) {
        const { db } = await connectDB();

        const result = await db.collection("members").updateMany(
            { trainer_id: id },
            { $set: { trainer_id: null } }
        );

        return result.modifiedCount;
    }

    async assignMember(id, trainer_id, adminId, session = null) {
        const { db } = await connectDB();

        const result = await db.collection("trainers").findOneAndUpdate(
            { _id: trainer_id },
            { 
                $addToSet: {
                    assigned_members: id
                },
                $set: {
                    updatedAt: new Date(),
                    updatedBy: adminId ?? id
                }
            },
            {   returnDocument: "after",
                projection: { password: 0 },
                ...(session ? { session } : {}),
            }
                
        );

        if(!result) {
            throw new Error("Failed to assign member");
        }
        
        return result;
    }
    
    async removeMember(id, member, data) {
        const { db } = await connectDB();

        const trainerUpdate = await db.collection("trainers").findOneAndUpdate(
            { _id: id },
            { 
                $pull: { assigned_members: member },
                $set: data 
            },
            { returnDocument: "after",
                projection: { password: 0 }
            }
        );

        const memberUpdate = await db.collection("members").findOneAndUpdate(
            { _id: member },
            { $set: { trainer_id: null, ...data } },
            { returnDocument: "after",
                projection: { password: 0 }
            }
        )

        if(!trainerUpdate) {
            throw new Error("Failed to remove member");
        }

        if(!memberUpdate) {
            throw new Error("Failed to remove trainer");
        }

        return {
            member: memberUpdate,
            trainer: trainerUpdate
        };
    }
}

export default new TrainerManagementModel();