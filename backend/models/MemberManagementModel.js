import { connectDB } from "../config/db.js";
import { ObjectId } from "mongodb";


class MemberManagementModel {

    async findUserByEmail(email) {
        const db = await connectDB();

        const doesExist = await db.collection("members").findOne(
            { email: email },
            { projection: { password: 0 } }
        )

        return doesExist;
    }

    async findUserById(id) {
        const db = await connectDB();

        const doesExist = await db.collection("members").findOne(
            { _id: new ObjectId(id) },
            { projection: { password: 0 } }
    );

        return doesExist;
    }

    async findUserByMembership(id) {
        const db = await connectDB();

        const doesExist = await db.collection("membership").findOne({
            member_id: new ObjectId(id)
        });

        return doesExist;
    }

    async createMember(data) {
        const db = await connectDB();

        const member = await db.collection("members").insertOne(data);

        if(!member || !member.acknowledged) {
            throw new Error("Failed to create the user");
        }

        return {
            _id: member.insertedId,
            ...data
        };
    }

    async listMembers(filter, search, page, limit) {
        const db = await connectDB();

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
            throw new Error("Error fetching all members");
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
        const db = await connectDB();

        const member = await db.collection("members").findOne({ _id: id });

        if(!member) {
            throw new Error("Error finding one member");
        }

        return member;
    }

    async updateMember(id, data) {
        const db = await connectDB();

        const result = await db.collection("members").updateOne(
            { _id: new ObjectId(id) },
            { $set: data }
        );

        if(!result || !result.acknowledged) throw new Error("Failed to update member");

        return result;
    }
    
    async updateMembership(id, data) {
        const db = await connectDB();

        const result = await db.collection("membership").updateOne(
            { member_id: new ObjectId(id) },
            { $set: data }
        );

        if(!result || !result.acknowledged || !result.matchedCount) throw new Error("Failed to update member");

        return result;
    }

    async updateUserStatus(id, memberData, membershipData) {
        const db = await connectDB();

        const session = db.client.startSession();

        try {
            await session.withTransaction(async () => {

                const member = await db.collection("members").updateOne(
                    { _id: id },
                    { $set: memberData },
                    { session }
                );

                const membership = await db.collection("membership").updateOne(
                    { member_id: id },
                    { $set: membershipData },
                    { session }
                );
                
                if(member.matchedCount === 0 || membership.matchedCount === 0) {
                    throw new Error("Failed to update status inside session");
                }
            });

            return { success: true }

        } catch (error) {
            throw new Error("Failed to update status: " + error.message);
        } finally {
            await session.endSession();
        }
    }

    async assignATrainer(id, trainer_id, adminId) {
        const db = await connectDB();

        const session = db.client.startSession();

       
        const trainer = await db.collection("trainers").findOne(
                    { _id: trainer_id },
                    { projection: { password: 0 } }
                );

                if(!trainer) {
                    throw new Error("Trainer is not found");
                }

                const assignedMembers = trainer.assigned_members || [];

                if(assignedMembers.length >= trainer.limit) {
                    throw new Error("Trainer is already full");
                }

                if(assignedMembers.some(id => id.equals(id))) {
                    throw new Error("Member already assigned to this trainer");
                }

                const memberUpdate = await db.collection("members").updateOne(
                    { _id: id },
                    {
                        $set: {
                            trainer_id: trainer_id,
                            updatedAt: new Date(),
                            updatedBy: adminId
                        }
                    }
                );

                const trainerUpdate = await db.collection("trainers").updateOne(
                    { _id: trainer_id },
                    {
                        $push: { assigned_members: id },
                        $set: {
                            updatedAt: new Date(),
                            updatedBy: adminId
                        }
                    }
                );

                if(!memberUpdate.matchedCount) {
                    throw new Error("Failed to process memberUpdate");
                }

                if(!trainerUpdate.matchedCount) {
                    throw new Error("Failed to process trainerUpdate");
                }
                

            return { memberUpdate, trainerUpdate }
    }
}

export default new MemberManagementModel();