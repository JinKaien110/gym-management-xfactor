import { connectDB } from "../config/db.js";
import bcrypt from "bcrypt";
import { ObjectId } from "mongodb";
import { hashedPassword } from "../utils/hashedPassword.js";
import { debuggerLog } from "../utils/debuggerLog.js";
import { generateQrCode } from "../utils/generateQrCode.js";
import { ValidationError } from "../errors/ValidationError.js";

class ClientModel {

    async RegisterUser(data) {
        const { db } = await connectDB();
        const result = await db.collection("clients").insertOne(data);

        const qr_code = generateQrCode(result.insertedId.toString());

        await db.collection("clients").updateOne(
            { _id: result.insertedId },
            { $set: { qr_code } }
        );

        return {
            id: result.insertedId,
            ...data,
            qr_code
        };
    }

    async findUserByEmail(email) {
        const { db } = await connectDB();

        const result = await db.collection("clients").findOne(
            { email: email }
        )

        return result;
    }

    async PostForm(id, data) {
        const { db } = await connectDB();

        const result = await db.collection("clients").findOneAndUpdate(
            { _id: new ObjectId(id) },
            { $set:  data },
            { returnDocument: "after",
                 projection: { password: 0 }
             }
            )

            if(!result) {
                throw new ValidationError("Failed to post form");
            }

            return result;
    }

    async listOfTrainersAfterPostForm(fitness_goal) {
        const { db } = await connectDB();

        const result = await db
        .collection("trainers")
        .find({
            specialization: { $in: fitness_goal },
            $expr: {
                $lt: [
                    { $size: { $ifNull: ['$assigned_clients', []] } },
                    "$max_clients"
                ]
            },
            projection: { password: 0 }
         })
        .toArray();

        return result;
    }

    async getAvailableTrainers(fitnessGoal) {
        const { db } = await connectDB();
        const result = await db.collection("trainers").aggregate([
            {
                $addFields: {
                    matchScore: { $cond: [{ $eq: ["$specialization", fitnessGoal] }, 1, 0] },
                    load: { $size: "$assigned_clients" },
                    stillAvailable: { $gt: [ { $size: "$assigned_clients"}, "$max_clients"] }
                }
            },
            {
                $match: { stillAvailable: true }
            },
            { $sort: { matchScore: -1, load: 1} }
        ]).toArray();
        return result;
    }

   

    /**
     * 
     * ADMIN FUNCTIONS BELOW
     * 
     */

    async createclient(data) {
        const { db } = await connectDB();

        const result = await db.collection("clients").insertOne(data);

        if(!result || !result.acknowledged) {
            throw new ValidationError("Failed to create the user");
        }

        const qr_code = generateQrCode(result.insertedId.toString());

        await db.collection("clients").updateOne(
            { _id: result.insertedId },
            { $set: { qr_code } }
        );

        return {
            _id: result.insertedId,
            ...data,
            qr_code
        };
    }

    async findUserById(id) {
        const { db } = await connectDB();

        const result = await db.collection("clients").findOne(
            { _id: new ObjectId(id) },
            { projection: { password: 0 } }
    );

        return result;
    }

    async findUserBymembership(id) {
        const { db } = await connectDB();

        const result = await db.collection("membership").findOne({
            client_id: new ObjectId(id)
        });

        return result;
    }

    

    async listclients(filter, search, page, limit) {
        const { db } = await connectDB();

        const pipeline = [
            { $match: filter },

            {
                $addFields: {
                    statusPriority: {
                        $switch: {
                            branches: [
                                { case: { $eq: ["$status", "active"] }, then: 1 },
                                { case: { $eq: ["$status", "inactive"] }, then: 2 },
                                { case: { $eq: ["$status", "archived"] }, then: 3 }
                            ],
                            default: 4
                        }
                    }
                }
            },

            { $sort: { statusPriority: 1, createdAt: -1 } },


            {
                $addFields: {
                    full_name: {
                        $concat: [
                            { $ifNull: ["$first_name", ""] },
                            " ",
                            { $ifNull: ["$last_name", ""] }
                        ]
                    }
                }
            },
        ];


        if (search) {
            pipeline.push({
                $match: {
                    $or: [
                        { first_name: { $regex: search, $options: "i" } },
                        { last_name: { $regex: search, $options: "i" } },
                        { full_name: { $regex: search, $options: "i" } }
                    ]
                }
            });
        }



        pipeline.push(
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
        );

        const result = await db.collection("clients").aggregate(pipeline).toArray();

        if(!result) {
            throw new ValidationError("Error fetching all clients");
        }

        const clients = result[0].data;
        const total = result[0].totalCount[0]?.count || 0;

        return {
            clients,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    }

    async viewclient(id) {
        const { db } = await connectDB();

        const result = await db.collection("clients").findOne({ _id: id });

        if(!result) {
            throw new ValidationError("Error finding one client");
        }

        return result;
    }

    async updateclient(id, data, session = null) {
        const { db } = await connectDB();

        const result = await db.collection("clients").findOneAndUpdate(
            { _id: new ObjectId(id) },
            { $set: data },
            { 
                returnDocument: "after",
                ...(session ? { session } : {}) 
            }
        );

        if(!result) throw new ValidationError("Failed to update client");

        return result;
    }

    async updateUserStatus(id, status, session = null) {
        const { db } = await connectDB();

        const result = await db.collection("clients").findOneAndUpdate(
            { _id: id },
            { $set: status },
            { 
                returnDocument: "after",
                projection: { password: 0 },
                ...(session ? { session } : {}) 
            }
        );

        return result;
    }

    async assignATrainer(id, trainer_id, adminId, session = null) {
        const { db } = await connectDB();

        const result = await db.collection("clients").findOneAndUpdate(
            { _id: id },
            {
                $set: {
                    trainer_id: trainer_id,
                    updatedAt: new Date(),
                    updatedBy: adminId ?? id
                }
            },
            {
                returnDocument: "after",
                projection: { password: 0 },
                ...(session ? { session } : {} )
            }
        );

        if(!result) {
            throw new ValidationError("Failed to process clientUpdate");
        }
        

        return result;
    }

    // Progress Log Methods
    async getProgressLog(clientId) {
        const { db } = await connectDB();
        const client = await db.collection("clients").findOne(
            { _id: new ObjectId(clientId) },
            { projection: { progressLog: 1, _id: 0 } }
        );
        return client?.progressLog || [];
    }

    async addProgressEntry(clientId, entry) {
        const { db } = await connectDB();
        const progressEntry = {
            _id: new ObjectId(),
            ...entry,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        const result = await db.collection("clients").findOneAndUpdate(
            { _id: new ObjectId(clientId) },
            { 
                $push: { progressLog: progressEntry },
                $set: { updatedAt: new Date() }
            },
            { returnDocument: "after", projection: { password: 0 } }
        );
        
        if (!result) {
            throw new ValidationError("Failed to add progress entry");
        }
        
        return progressEntry;
    }

    async updateProgressEntry(clientId, entryId, updates) {
        const { db } = await connectDB();
        
        const result = await db.collection("clients").findOneAndUpdate(
            { 
                _id: new ObjectId(clientId),
                "progressLog._id": new ObjectId(entryId)
            },
            { 
                $set: { 
                    "progressLog.$": {
                        ...updates,
                        _id: new ObjectId(entryId),
                        updatedAt: new Date()
                    },
                    updatedAt: new Date()
                }
            },
            { returnDocument: "after", projection: { password: 0 } }
        );
        
        if (!result) {
            throw new ValidationError("Failed to update progress entry");
        }
        
        return result.progressLog?.find(e => e._id.toString() === entryId);
    }

    async deleteProgressEntry(clientId, entryId) {
        const { db } = await connectDB();
        
        const result = await db.collection("clients").findOneAndUpdate(
            { _id: new ObjectId(clientId) },
            { 
                $pull: { progressLog: { _id: new ObjectId(entryId) } },
                $set: { updatedAt: new Date() }
            },
            { returnDocument: "after", projection: { password: 0 } }
        );
        
        if (!result) {
            throw new ValidationError("Failed to delete progress entry");
        }
        
        return { success: true };
    }
}

export default new ClientModel();
