import { connectDB } from "../config/db.js";
import { ObjectId } from "mongodb";
import { debuggerLog } from "../utils/debuggerLog.js";

class AdminModel {
    async createPlansModel(plandata) {
        const db = await connectDB();
        try {

            const planAdded = await db.collection("plans").insertOne(plandata);

            if(!planAdded.acknowledged) {
                throw new Error("Plan insertion failed");
            }

            return planAdded;

        } catch (error) {
            debuggerLog("createPlansModel Model", error);
            return { message: "createPlansModel Model", error };
        }
    }
    
    async viewAllPlans(filter, page, limit) {
        const db = await connectDB();
        try {
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

            return { total, page, limit, pages: Math.ceil(total / limit), data: plans};
        } catch (error) {
            debuggerLog("viewAllPlans Model", error);
            return { message: "viewAllPlans Model", error };
        }
    }

    async viewAPlan(id) {
        const db = await connectDB();
        try {
            const plan = await db.collection("plans").findOne({ _id: id});

            if(!plan) return { message: "Missing plan"};

            return plan;
        } catch (error) {
            debuggerLog("viewAPlan Model", error);
            return { message: "viewAPlan Model", error };
        }
    }

    async updatePlan(id, data) {
        const db = await connectDB();
        try {
            const updatedPlan = await db.collection("plans").updateOne(
                { _id: id},
                { $set: data}
            );

            if(!updatedPlan.matchedCount === 0) {
                return { message: "Plan not found"}
            }

            return { updatedPlan, message: "Successfully updated the plan" };
        } catch (error) {
            debuggerLog("updatePlan Model", error);
            return { message: "updatePlan Model", error };
        }
    }

    async updatePlanStatus(id, data) {
        const db = await connectDB();
        try{ 
            const updatedStatus = await db.collection("plans").updateOne(
                { _id: id },
                { $set: data }
            );

            if(updatedStatus.matchedCount === 0) {
                return { message: "Plan not found"}
            }

            return { updatedStatus, message: "Successfully updated the status" };
        } catch (error) {
            debuggerLog("updatePlanStatus Model", error);
            return { message: "updatePlanStatus Model", error };
        }
    }

    async createPricingModel(pricingData) {
        const db = await connectDB();
        try {
            const newPricing = await db.collection("pricing").insertOne(pricingData)

            if(!newPricing.acknowledged) throw new Error("Pricing insertion failed");

            return newPricing;

        } catch (error) {
            debuggerLog("createPricingModel Model", error);
            return { message: "createPricingModel Model", error };
        }
    }

    async viewAllPricing(filter, page, limit) {
        const db = await connectDB();

        const prices = await db.collection("pricing").aggregate([
            { $match: filter },
            {
                $addFields: {
                    statusPriority: {
                        $switch: {
                            branches: [
                                { case: { $eq: ["$status", "active"] }, then: 1 },
                                { case: { $eq: ["$status", "inactive"] }, then: 2},
                                { case: { $eq: ["$status", "archived"] }, then: 3}
                            ],
                            default: 4
                        }
                    }
                }
            },

            { $sort: { statusPriority: 1, createdAt: -1 } },
            { $skip: (page - 1) * limit },
            { $limit: limit }
        ]).toArray();

        const total = await db.collection("pricing").countDocuments(filter);

        return { total, page, limit, pages: Math.ceil(total / limit), data: prices};
    }

    async viewOnePricing(id) {
        const db = await connectDB();

        const price = await db.collection("pricing").findOne({ _id: id });

        if(!price) {
            throw new Error("Error showing a price");
        }

        return price;
    }

    async viewPricingByPlan(id) {
        const db = await connectDB();

        const result = await db.collection("pricing").aggregate([
            {
                $match: {
                    plan_id: id,
                    status: { $in: ["active", "inactive", "archived"] },
                }
            },
            {
                $addFields: {
                    statusPriority: {
                        $switch: {
                            branches: [
                                { case: { $eq: ["$status", "active"] }, then: 1 },
                                { case: { $eq: ["$status", "inactive"] }, then: 2},
                                { case: { $eq: ["$status", "archived"] }, then: 3}
                            ],
                            default: 4
                        }
                    }
                }
            }, 
            { $sort: { statusPriority: 1, createdAt: -1} },
            {
                $lookup: {
                    from: "plans",
                    localField: "plan_id",
                    foreignField: "_id",
                    as: "plan"
                }
            },
            { $unwind: "$plan" },
            {
                $group: {
                    _id: "$plan._id",
                    plan_id: { $first: "$plan._id" },
                    name: { $first: "$plan.name" },
                    label: { $first: "$plan.label" },
                    pricing: { 
                        $push: {
                            _id: "$_id",
                            category: "$category",
                            label: "$label",
                            duration: "$duration",
                            price: "$price",
                            membership_fee: "$membership_fee",
                            status: "$status"
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 1,
                    plan_id: 1,
                    name: 1,
                    label: 1,
                    pricing: 1
                }
            }
            
        ]).toArray();
        
        return result[0] || null;
    }

    async updatePricing(priceData) {
        const db = await connectDB();

        const { _id, ...fieldsToUpdate } = priceData;

        const result = await db.collection("pricing").updateOne(
            { _id },
            { $set: fieldsToUpdate }
        );

        if(!result || !result.acknowledged) {
            throw new Error("Failed to update a pricing");
        }

        return result;
    }

    async updatePricingStatus(data) {
        const db = await connectDB();

        const { _id, ...fieldsToUpdate } = data;

        const updatedStatus = await db.collection("pricing").updateOne(
            { _id },
            { $set: fieldsToUpdate }
        )

        if(!updatedStatus || !updatedStatus.acknowledged) {
            throw new Error("Failed to update the price status");
        }

        return;
    }
}

export default new AdminModel();