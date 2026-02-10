import { ValidationError } from "../errors/ValidationError.js";
import { connectDB } from "../config/db.js";

class PlanModel {
    async createPlans(plandata) {
        const { db } = await connectDB();
        const result = await db.collection("plans").insertOne(plandata);

        if(!result.acknowledged) {
            throw new ValidationError("Plan insertion failed");
        }

        return {
            result: result.insertedId,
            ...plandata
        };
    }
    
    async viewAllPlans(filter, page, limit) {
        const { db } = await connectDB();
        const plans = await db.collection("plans")
            .aggregate([
            { $match: filter },

            {
                $addFields: {
                    statusPriority: {
                        $switch: {
                            branches: [
                                { case: { $eq: ["$status", "active"] }, then: 1},
                                { case: { $eq: ["$status", "inactive"] }, then: 2 },
                                { case: { $eq: ["$status", "archived"] }, then: 3 }
                            ],
                            default: 4
                        }
                    }
                }
            },

            { $sort: { statusPriority: 1, createdAt: -1 } },

            { $skip: (page - 1) * limit },
            { $limit: limit }
        ])
        .toArray();

        const total = await db.collection("plans").countDocuments(filter);

        return { 
            total, page, limit, pages: Math.ceil(total / limit), data: plans };
    }

    async viewAPlan(id) {
        const { db } = await connectDB();
        const result = await db.collection("plans").findOne({ _id: id});

        if(!result) throw new ValidationError("No plan found");

        return result;
    }

    async updatePlan(id, data) {
        const { db } = await connectDB();
        const result = await db.collection("plans").updateOne(
            { _id: id},
            { $set: data}
        );

        if(!result.matchedCount === 0) {
           throw new ValidationError("Plan not found");
        }

        return {
            result: {
                id,
                ...data
            }
        };
    }

    async updatePlanStatus(id, data) {
        const { db } = await connectDB();
        const result = await db.collection("plans").updateOne(
            { _id: id },
            { $set: data }
        );

        if(result.matchedCount === 0) {
           throw new ValidationError("Plan not found");
        }

        return {
            result: {
                id,
                ...data
            }
        };
    }


}

export default new PlanModel();