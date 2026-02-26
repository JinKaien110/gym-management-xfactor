import { ValidationError } from "../errors/ValidationError.js";
import AuditLogsService from "./audit.logs.service.js"; 
import PricingModel from "../models/PricingModel.js";
import { debuggerLog } from "../utils/debuggerLog.js";
import { ObjectId } from "mongodb";
import PlanModel from "../models/PlanModel.js";

class PricingService {
    async createPricing(meta, body, updater) {
        const { plan_id, name, label, duration_days, price, membership_fee, type } = body;

        let adminId = updater.id;

        if(!adminId || !ObjectId.isValid(adminId)) {
            throw new ValidationError("Invalid admin Id");
        }

        if(!plan_id || !name || !label || !duration_days || !price || !membership_fee || !type) {
            throw new ValidationError("Please fillout the necessary fields!");
        }

        if(!ObjectId.isValid(plan_id)) throw new ValidationError("Invalid plan ID");

        const allowedTypes = ["regular", "discounted"];
        if(!allowedTypes.includes(type)) throw new ValidationError("Pricing type value is not valid");

        const planId = new ObjectId(plan_id);
        const plan = await PlanModel.viewAPlan(planId);
        if(!plan) throw new ValidationError("Plan does not exist");
        adminId = new ObjectId(adminId);

        const sanitized = {
            plan_id: planId,
            name: name.trim().toLowerCase(),
            label: label.trim(),
            duration_days: Number(duration_days),
            price: Number(price),
            membership_fee: Number(membership_fee),
            type: type.trim().toLowerCase(),
            status: "active",
            createdAt: new Date(),
            createdBy: adminId,
            updatedAt: new Date(),
            updatedBy: adminId,
            archivedAt: null,
            archivedBy: null
        }

        return await AuditLogsService.auditWrap({
            action: "PRICING_CREATED",
            entity: "pricing",
            actor: { id: adminId, role: updater.role  }, 
            meta: meta,
            summary: `${updater.first_name} ${updater.last_name} (${updater.role} → ${updater.user_type}) created a pricing ${label} duration of ${duration_days} days with a price of ${price} membership fee of ${membership_fee} for ${type} member type for plan ${plan.label}`,
            fn: async () => {
                return await PricingModel.createPricing(sanitized);
            }
        });
        
    }

    async viewAllPricing(query) {
        let { name, price, membership_fee, status, type, page = 1, limit = 10 } = query;
        
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

        if(type) {
            filter.type = String(type).trim().toLowerCase();
        }

        return await PricingModel.viewAllPricing(filter, page, limit);
    }

    async viewOnePricing(id) {
        if(!id || !ObjectId.isValid(id)) {
            throw new ValidationError("Invalid ID format");
        }
        const pricing_id = new ObjectId(id);

        return await PricingModel.viewOnePricing(pricing_id);
    }

    async viewPricingByPlan(id) {
        if(!id || !ObjectId.isValid(id)) {
            throw new ValidationError("Invalid ID format" );
        }

        const pricing_id = new ObjectId(id);

        const pricing = await PricingModel.viewPricingByPlan(pricing_id);

        if(!pricing) {
            throw new ValidationError("No pricing found for this plan");
        }

        return pricing;
    }

    async updatePricing(id, meta, body, updater) {
        const { name, label, price, duration_days, membership_fee, type  } = body;
        let adminId = updater.id; 

        if(!id || !ObjectId.isValid(id)) {
            throw new ValidationError("Invalid price ID");
        }

        if(!adminId || !ObjectId.isValid(adminId)) {
            throw new ValidationError("Invalid admin  ID");
        }

        if(!name || !label || !price || !duration_days || !membership_fee || !type) {
            throw new ValidationError("Please fill out the necessary fields");
        }

        id = new ObjectId(id);
        adminId = new ObjectId(adminId);

        const Exist = await PricingModel.getPricing(id);
        if(!Exist) {
            throw new ValidationError("No pricing found");
        }

        const priceData = {
            _id: id,
            name: name.trim().toLowerCase(),
            label: label.trim(),
            price: Number(price),
            duration_days: Number(duration_days),
            membership_fee: Number(membership_fee),
            type: String(type).trim().toLowerCase(),
            updatedAt: new Date(),
            updatedBy: adminId
        }

        return await AuditLogsService.auditWrap({
            action: "PRICING_UPDATED",
            entity: "pricing",
            entity_id: new ObjectId(id),
            actor: { id: adminId, role: updater.role, user_type: updater.user_type  }, 
            meta: meta,
            changes: {
                patch: {
                    before: {
                        name: Exist.name,
                        label: Exist.label,
                        price: Exist.price,
                        duration_days: Exist.duration_days,
                        membership_fee: Exist.membership_fee,
                        type: Exist.type
                    },
                    after: {
                        name: priceData.name ?? Exist.name,
                        label: priceData.label ?? Exist.label,
                        price: priceData.price ?? Exist.price,
                        duration_days: priceData.duration_days ?? Exist.duration_days,
                        membership_fee: priceData.membership_fee ?? Exist.membership_fee,
                        type: priceData.type ?? Exist.type
                    }
                }
            },
            summary: `${updater.first_name} ${updater.last_name} (${updater.role} → ${updater.user_type}) updated the pricing ${Exist.label} to duration of ${duration_days} days with a price of ${price} membership fee of ${membership_fee} for ${type} member type`,
            fn: async () => {
                return await PricingModel.updatePricing(priceData);
            }
        });
    }

    async updatePricingStatus(id, meta, status, updater) {
        let adminId = updater.id;

        if(!id || !ObjectId.isValid(id)) {
            throw new ValidationError("Invalid price ID");
        }

        const Exist = await PricingModel.getPricing(new ObjectId(id));
        if(!Exist) {
            throw new ValidationError("No pricing found");
        }

        if(!adminId || !ObjectId.isValid(adminId)) {
            throw new ValidationError("Invalid admin ID");
        }

        if(!status) {
            throw new ValidationError("Missing status value");
        }

        const allowedStatus = ["active", "inactive", "archived"];

        if(!allowedStatus.includes(status)) {
            throw new ValidationError("Invalid status value");
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

        return await AuditLogsService.auditWrap({
            action: "PRICING_UPDATE",
            entity: "pricing",
            actor: { id: adminId, role: updater.role, user_type: updater.user_type  }, 
            meta: meta,
            summary: `${updater.first_name} ${updater.last_name} (${updater.role} → ${updater.user_type}) updated ${Exist.label} status to ${status}`,
            changes: {
                patch: {
                    before: {
                        status: Exist.status
                    },
                    after: {
                        status: status ?? Exist.status
                    }
                }
            },
            fn: async () => {
                return await PricingModel.updatePricingStatus(price);
            }
        });
        
    }
}

export default new PricingService();