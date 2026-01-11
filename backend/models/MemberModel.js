import { connectDB } from "../config/db.js";
import bcrypt from "bcrypt";
import { ObjectId } from "mongodb";
import { hashedPassword } from "../utils/hashedPassword.js";
import { debuggerLog } from "../utils/debuggerLog.js";
import { generateQrCode } from "../utils/generateQrCode.js";

class MemberModel {

    async RegisterUser(UserData) {
        try{ 
            const db = await connectDB();
            const hashpassword = await hashedPassword(UserData.password);
            console.log("here")
            const result = await db.collection("members").insertOne({
                ...UserData, 
                password: hashpassword
            });

            return result;
        } catch(error) {
            console.log("Something went wrong: (UserModel - UserRegister)", error);
            return "Something went wrong: (UserModel - UserRegister)";
        }
    }

    async FindUserById(id) {
        const db = await connectDB();
        const UserId = await db.collection("members").findOne(
            { _id: new ObjectId(id) },
            { projection: { password: 0 } }
        );

        if(!UserId) {
            console.log("Something went wrong: (UserModel - UserRegister)");
            return "Something went wrong: (UserModel - UserRegister)";
        }
        return UserId;
    }

    async PostForm(UserData, id) {
        try {
            const db = await connectDB();
            const qr = await generateQrCode(id);

            const newUser = {
                gender: UserData.gender?.trim().toLowerCase() || null,
                age: UserData.age ? Number(UserData.age) : null,
                height: UserData.height ? Number(UserData.height) : null,
                weight: UserData.weight ? Number(UserData.weight) : null,
                bmi: UserData.bmi ? Number(UserData.bmi.toFixed(1)) : null,
                fitness_goal: UserData.fitness_goal?.trim() || null,
                medical_condition: UserData.medical_condition?.trim() || null,
                qr_code: qr,
                updatedAt: new Date(),
                updatedBy: new ObjectId(id)
            }

            const memberupdate = await db.collection("members").updateOne(
                { _id: new ObjectId(id) },
                { $set:  newUser }
             )

             if(memberupdate.acknowledged) {
                return memberupdate;
             }

        } catch (error) {
            debuggerLog("PostForm Model", error);
            return "PostForm Model", error
        }
    }

    async getAvailableTrainers(fitnessGoal) {
        try {
            const db = await connectDB();
            const allTrainers = await db.collection("trainers").aggregate([
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
            return allTrainers;

        } catch (error) {
            debuggerLog("getAvailableTrainers Model", error);
            return { message: "getAvailableTrainers Model", error };

        }
    }

    async assignedTrainer(memberId, trainer_id) {
       const db = await connectDB();
       const session = db.client.startSession();

       try {
        let result;

        await session.withTransaction(async () => {
            const membersCollection = db.collection("members");
            const trainersCollection = db.collection("trainers");
            
            const member = await membersCollection.findOne(
                { _id: new ObjectId(memberId) },
                { session }
            );

            if(!member) throw new Error("Member not found");
            if(member.trainer_id) throw new Error("Member already has a trainer");

            const assignMemberResult = await membersCollection.updateOne(
                { _id: new ObjectId(memberId) },
                { $set: { trainer_id: new ObjectId(trainer_id), updatedAt: new Date() } },
                { session }
            );

            if(!assignMemberResult.acknowledged) throw new Error("Failed to assign a trainer");

            const assignTrainerResult = await trainersCollection.updateOne(
                { _id: new ObjectId(trainer_id) },
                {
                    $addToSet: { assigned_members: new ObjectId(memberId) },
                    $set: { updatedAt: new Date() }
                },
                { session }
            );

            if(!assignTrainerResult.acknowledged) throw new Error("Failed to add members in trainers array");

            result = { message: "Trainer assigned successfully" };
        });

        return result;

       } catch (error) {
            debuggerLog("assignedTrainer Model", error);
            throw error;
       } finally {
        await session.endSession();
       }
    }
}

export default new MemberModel();
