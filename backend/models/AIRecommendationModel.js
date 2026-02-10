import { ObjectId } from "mongodb";
import { connectDB } from "../config/db.js";
import { ValidationError } from "../errors/ValidationError.js";

class AIRecommendationModel {
    async findById(id) {
        const { db } = await connectDB();

        const result = await db.collection("workout_recommendations").findOne(id)

        return result;
    }

    async requestRecommendation(data) {
        const { db } = await connectDB();

        const result = await db.collection("workout_recommendations").insertOne(data)

        if(!result || !result.acknowledged) {
            throw new ValidationError("Failed to insert workout recommendations");
        }

        return {
            data: {
                _id: result.insertedId,
                ...data
            }
        };
    }

    async decisionRecommendationByTrainer(id, data) {
        const { db } = await connectDB();

        const result = await db.collection("workout_recommendations").findOneAndUpdate(
            { _id: id },
            { $set: data },
            { returnDocument: "after" }
        )

        if(!result) {
            throw new ValidationError("Failed to update decision");
        }

        return result;
    }

    async findLatestByParentId(id) {
        const { db } = await connectDB();

        return await db.collection("workout_recommendations").findOne(
            { parent_id: id },
            { sort: { version: -1, createdAt: -1 } }
        )
    }

    async getRecommendationDetails(req, res, next) {
        
    }

    async getMemberWorkoutNotes(req, res, next) {
        
    }

    async listTrainerPendingRecommendations(id, page, limit) {
        const { db } = await connectDB();
        const skip = (page - 1) * limit

        const data = await db.collection("workout_recommendations").find({ 
            trainer_id: id,
            status: "pending"
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();

        const total = await db.collection("work_recommendations").countDocuments({
            trainer_id: id,
            status: "pending"
        })

        return {
            data,
            total,
            page: Math.ceil(skip / limit) + 1,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    }

    async listAllRecommendations(filter, page, limit) {
        const { db } = await connectDB();
        const skip = (page - 1) * limit

        const data = await db.collection("workout_recommendations")
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();

        const total = await db.collection("workout_recommendations").countDocuments(filter)

        if(!data.length === 0 || !data) {
            return {
                data: [],
                page,
                limit,
                total,
                totalPages: 0,
            }
        }

        return {
            data,
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    }

    async getRecommendationChain(id) {
        const { db } = await connectDB()

        const versions = await db.collection("workout_recommendations")
        .find({
            $or: [
                { _id: id },
                { parent_id: id }
            ]
        })
        .sort({ version: -1 })
        .toArray();

        if (!versions || versions.length === 0) {
            throw new ValidationError("No recommendation versions found");
        }


        const latest = versions[0]

        return {
            chain_id: id,
            latest,
            versions
        }
    }
}

export default new AIRecommendationModel();