import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { ObjectId } from "mongodb";
import { debuggerLog } from "../utils/debuggerLog.js";
import AdminModel from "../models/AdminModel.js";

dotenv.config();

class AdminController {
    async createPlansController(req, res) {
        try {
            const { name, label } = req.body;
            let adminId = req.user.id;

            if(!name || !label) {
                return res.status(400).json({ message: "Please fillout the necessary fields!"});
            }

            if(!adminId || !ObjectId.isValid(adminId)) {
                return res.status(400).json({ message: "Invalid admin Id"});
            }

            const sanitized = {
                name: name.trim().toLowerCase(),
                label: label.trim(),
                status: "active",
                createdAt: new Date(),
                createdBy: new ObjectId(adminId),
                updatedAt: new Date(),
                updatedBy: new ObjectId(adminId),
                archivedAt: null,
                archivedBy: null
            }

            const newPlan = await AdminModel.createPlansModel(sanitized);

            return res.status(201).json({ 
                message: " You successfully added a new plan",
                plan: newPlan.insertedId
            });

        } catch (error) {
            debuggerLog("createPlansController Controller", error);
            return res.status(500).json({ message: "Failed to create plan", error });
        }
    }

    async viewAllPlans(req, res) {
        try {
            let { status, name, page = 1, limit = 10 } = req.query;
            console.log(page, limit)
            page = Number(page)
            limit = Number(limit)

            const filter = {};

            if(status) {
                filter.status = status.trim().toLowerCase();
            }

            if(name) {
                filter.name = name.trim().toLowerCase();
            }

            const AllPlans = await AdminModel.viewAllPlans(filter, page, limit);

            return res.status(200).json({ message: "Plans fetched successfully", ...AllPlans });
            
        } catch (error) {
            debuggerLog("viewAllPlans Controller", error);
            return res.status(500).json({ message: "Failed to view all plans", error });
        }
    }

    async viewAPlan(req, res) {
        try {
            const { id } = req.params;

            if(!id) return res.status(400).json({ message: "Missing plan id"});

            if(!ObjectId.isValid(id)) return res.status(400).json({ message: "plan id is invalid"});
            
            const sanitized = new ObjectId(id);

            const plan = await AdminModel.viewAPlan(sanitized);

            return res.status(200).json(plan);
        } catch (error) {
            debuggerLog("viewAPlan Controller", error);
            return res.status(500).json({ message: "Failed to view a plan", error });
        }
    }

    async updatePlan(req, res) {
        try {
            const { id } = req.params;
            let adminId = req.user.id;

            if(!id || !ObjectId.isValid(id)) {
                return res.status(400).json({ message: "Invalid plan id"});
            }

            if(!adminId || !ObjectId.isValid(adminId)) {
                return res.status(400).json({ message: "Invalid admin Id"});
            }

            const plan_id = new ObjectId(id);

            const { name, label } = req.body;

            const sanitized = {};

            if(name) sanitized.name = name.trim().toLowerCase();
            if(label) sanitized.label = label.trim();

            sanitized.updatedAt = new Date();
            sanitized.updatedBy = new ObjectId(adminId);

            const updatedPlan = await AdminModel.updatePlan(plan_id, sanitized);

            return res.status(200).json(updatedPlan)


        } catch (error) {
            debuggerLog("updatePlan Controller", error);
            return res.status(500).json({ message: "Failed to update a plan", error });
        }
    }

    async updatePlanStatus(req, res) {
        try {
            const { id } = req.params;
            let adminId = req.user.id;
            
            if(!id || !ObjectId.isValid(id)) {
                return res.status(400).json({ message: "Invalid plan id"});
            }

            if(!adminId || !ObjectId.isValid(adminId)) {
                return res.status(400).json({ message: "Invalid admin Id"});
            }

            const plan_id = new ObjectId(id);
            adminId = new ObjectId(adminId);

            const { status } = req.body;

            if(!status) {
                return res.status(400).json({ message: "Missing status change value"});
            }

            const allowedStatus = ["active", "inactive", "archived"];
            if(!allowedStatus.includes(status)) {
                return res.status(400).json({ message: "Invalid status value"});
            }

            let archivedAt = null;
            let archivedBy = null;

            if(status === "archived") {
                archivedAt = new Date();
                archivedBy = new ObjectId(adminId);
            } 

            const sanitized = {
                status: status.trim().toLowerCase(),
                updatedAt: new Date(),
                updatedBy: adminId,
                archivedAt: archivedAt,
                archivedBy: archivedBy
            };

            const updatedStatus = await AdminModel.updatePlanStatus(plan_id, sanitized);

            return res.status(200).json(updatedStatus);

        } catch (error) {
            debuggerLog("updatePlanStatus Controller", error);
            return res.status(500).json({ message: "Failed to update a plan status", error });
        }
    }

    async createPricingController(req, res) {
        try {
            const { plan_id, name, label, duration_days, price, membership_fee } = req.body;

            let adminId = req.user.id;

            if(!adminId || !ObjectId.isValid(adminId)) {
                return res.status(400).json({ message: "Invalid admin Id"});
            }

            if(!plan_id || !name || !label || !duration_days || !price || !membership_fee) {
                return res.status(400).json({ message: "Please fillout the necessary fields!"});
            }

            if(!ObjectId.isValid(plan_id)) throw new Error("Invalid plan ID");

            const planId = new ObjectId(plan_id);
            adminId = new ObjectId(adminId);

            const sanitized = {
                plan_id: planId,
                name: name.trim().toLowerCase(),
                label: label.trim(),
                duration_days: Number(duration_days),
                price: Number(price),
                membership_fee: Number(membership_fee),
                status: "active",
                createdAt: new Date(),
                createdBy: adminId,
                updatedAt: new Date(),
                updatedBy: adminId,
                archivedAt: null,
                archivedBy: null
            }

            const newPricing = await AdminModel.createPricingModel(sanitized);

            return res.status(201).json({ message: "You successfully added a new pricing", newPricing: newPricing.insertedId});

        } catch  (error) {
            debuggerLog("createPricingController Controller", error);
            return res.status(500).json({ message: "Failed to create pricing", error });
        }
    }

    async viewAllPricing(req, res) {
        try {
            let { name, price, membership_fee, status, page = 1, limit = 10 } = req.query;
            
            page = Number(page);
            limit = Number(limit);
            price = Number(price);
            membership_fee = Number(membership_fee);

            const filter = {};

            if(status) {
                filter.status = status.trim().toLowerCase();
            }

            if(name) {
                filter.name = name.trim().toLowerCase();
            }

            if(price) {
                filter.price = price;
            }

            if(membership_fee) {
                filter.membership_fee = membership_fee;
            }

            const allPrices = await AdminModel.viewAllPricing(filter, page, limit);

            return res.status(200).json(allPrices);

        } catch (error) {
            debuggerLog("viewAllPricing Controller", error);
            return res.status(500).json({ message: "Failed to list all  pricing", error });
        }
    }

    async viewOnePricing(req, res) {
        try {
            const { id } = req.params;

            if(!id || !ObjectId.isValid(id)) {
                return res.status(400).json({ message: "Invalid ID format"});
            }

            const pricing_id = new ObjectId(id);

            const pricing = await AdminModel.viewOnePricing(pricing_id);

            return res.status(200).json(pricing);

        } catch (error) {
            debuggerLog("viewOnePricing Controller", error);
            return res.status(500).json({ message: "Failed to list a  pricing", error });
        }
    }

    async viewPricingByPlan(req, res) {
        try {
            const { plan_id } = req.params;

            if(!plan_id || !ObjectId.isValid(plan_id)) {
                return res.status(400).json({ message: "Invalid ID format" });
            }

            const pricing_id = new ObjectId(plan_id);

            const pricing = await AdminModel.viewPricingByPlan(pricing_id);

            if(!pricing) {
                return res.status(400).json({ message: "No pricing found for this plan"});
            }

            return res.status(200).json(pricing);

        } catch (error) {
            debuggerLog("viewPricingByPlan Controller", error);
            return res.status(500).json({ message: "Failed to list a  pricing", error });
        }
    }

    async updatePricing(req, res) {
        try {
            let { id } = req.params;
            const { name, label, price, duration_days, membership_fee,  } = req.body;
            let adminId = req.user.id; 

            if(!id || !ObjectId.isValid(id)) {
                return res.status(400).json({ message: "Invalid price ID"});
            }

            if(!adminId || !ObjectId.isValid(adminId)) {
                return res.status(400).json({ message: "Invalid admin  ID"});
            }

            if(!name || !label || !price || !duration_days || !membership_fee) {
                return res.status(400).json({ message: "Please fill out the necessary fields"});
            }

            id = new ObjectId(id);
            adminId = new ObjectId(adminId);

            const priceData = {
                _id: id,
                name: name.trim().toLowerCase(),
                label: label.trim(),
                price: Number(price),
                duration_days: Number(duration_days),
                membership_fee: Number(membership_fee),
                updatedAt: new Date(),
                updatedBy: adminId
            }

            const updatedPrice = await AdminModel.updatePricing(priceData);

            return res.status(200).json({ message: "Successfully updated the price", updatedPrice});

        } catch(error) {
            debuggerLog("updatePricing Controller", error);
            return res.status(500).json({ message: "Failed to update a  pricing", error });
        }
    }

    async updatePricingStatus(req, res) {
        try {
            let { id } = req.params;
            let { status } = req.body;
            let adminId = req.user.id;
 
            if(!id || !ObjectId.isValid(id)) {
                return res.status(400).json({ message: "Invalid price ID"});
            }

            if(!adminId || !ObjectId.isValid(adminId)) {
                return res.status(400).json({ message: "Invalid admin ID"});
            }

            if(!status) {
                return res.status(400).json({ message: "Missing status value"});
            }

            const allowedStatus = ["active", "inactive", "archived"];

            if(!allowedStatus.includes(status)) {
                return res.status(400).json({ message: "Invalid status value"});
            }

            let archivedAt = null;
            let archivedBy = null;

            if(status === "archived") {
                archivedAt = new Date();
                archivedBy = new ObjectId(adminId)
            } 

            const price = {
                _id: new ObjectId(id),
                status: status.trim().toLowerCase(),
                updatedAt: new Date(),
                updatedBy: new ObjectId(adminId),
                archivedAt: archivedAt,
                archivedBy: archivedBy
            }

            const updatedPrice = await AdminModel.updatePricingStatus(price);

            return res.status(200).json({ message: "Successfully updated the price status", updatedPrice});

        } catch (error) {
            debuggerLog("updatePricingStatus Controller", error);
            return res.status(500).json({ message: "Failed to update a  pricing status", error });
        }
    }
}

export default new AdminController();