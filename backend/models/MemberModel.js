import { connectDB } from "../config/db.js";
import bcrypt from "bcrypt";
import { ObjectId } from "mongodb";
import { hashedPassword } from "../utils/hashedPassword.js";
import { debuggerLog } from "../utils/debuggerLog.js";
import { generateQrCode } from "../utils/generateQrCode.js";
import { ValidationError } from "../errors/ValidationError.js";

class MemberModel {

    async RegisterUser(data) {
        const { db } = await connectDB();
        const result = await db.collection("members").insertOne(data);

        return {
            id: result.insertedId,
            ...data
        };
    }

    async findUserByEmail(email) {
        const { db } = await connectDB();

        const result = await db.collection("members").findOne(
            { email: email },
            { projection: { password: 0 } }
        )

        return result;
    }

    async PostForm(id, data) {
        const { db } = await connectDB();

        const result = await db.collection("members").findOneAndUpdate(
            { _id: new ObjectId(id) },
            { $set:  data },
            { returnDocument: "after" }
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
                    { $size: { $ifNull: ['$assigned_members', []] } },
                    "$max_members"
                ]
            } })
        .toArray();

        return result;
    }

    async getAvailableTrainers(fitnessGoal) {
        const { db } = await connectDB();
        const result = await db.collection("trainers").aggregate([
            {
                $addFields: {
                    matchScore: { $cond: [{ $eq: ["$specialization", fitnessGoal] }, 1, 0] },
                    load: { $size: "$assigned_members" },
                    stillAvailable: { $gt: [ { $size: "$assigned_members"}, "$max_members"] }
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

    async createMember(data) {
        const { db } = await connectDB();

        const result = await db.collection("members").insertOne(data);

        if(!result || !result.acknowledged) {
            throw new ValidationError("Failed to create the user");
        }

        return {
            _id: result.insertedId,
            ...data
        };
    }

    async findUserById(id) {
        const { db } = await connectDB();

        const result = await db.collection("members").findOne(
            { _id: new ObjectId(id) },
            { projection: { password: 0 } }
    );

        return result;
    }

    async findUserByMembership(id) {
        const { db } = await connectDB();

        const result = await db.collection("membership").findOne({
            member_id: new ObjectId(id)
        });

        return result;
    }

    

    async listMembers(filter, search, page, limit) {
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

        const result = await db.collection("members").aggregate(pipeline).toArray();

        if(!result) {
            throw new ValidationError("Error fetching all members");
        }

        const members = result[0].data;
        const total = result[0].totalCount[0]?.count || 0;

        return {
            members,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    }

    async viewMember(id) {
        const { db } = await connectDB();

        const result = await db.collection("members").findOne({ _id: id });

        if(!result) {
            throw new ValidationError("Error finding one member");
        }

        return result;
    }

    async updateMember(id, data, session = null) {
        const { db } = await connectDB();

        const result = await db.collection("members").findOneAndUpdate(
            { _id: new ObjectId(id) },
            { $set: data },
            { 
                returnDocument: "after",
                ...(session ? { session } : {}) 
            }
        );

        if(!result) throw new ValidationError("Failed to update member");

        return result;
    }

    async updateUserStatus(id, status, session = null) {
        const { db } = await connectDB();

        const result = await db.collection("members").findOneAndUpdate(
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

        const result = await db.collection("members").findOneAndUpdate(
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
            throw new ValidationError("Failed to process memberUpdate");
        }
        

        return result;
    }
}

export default new MemberModel();
