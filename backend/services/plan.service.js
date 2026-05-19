import { ValidationError } from "../errors/ValidationError.js";
import AuditLogsService from "./audit.logs.service.js"; 
import PlanModel from "../models/PlanModel.js";
import { ObjectId } from "mongodb";


class PlanService {
    
    async createPlans(meta, body, updater) {  
        const { label, duration, duration_days } = body;
        let adminId = updater.id;
    
        if(!label?.trim() || !duration?.trim() || !Number(duration_days)) {
            throw new ValidationError("Please fillout the necessary fields!");
        }
    
        if(!adminId || !ObjectId.isValid(adminId)) {
            throw new ValidationError("Invalid admin Id");
        }

        return await AuditLogsService.auditWrap({
            action: "PLAN_CREATED",
            entity: "plans",
            actor: { id: adminId, role: updater.role, user_type: updater.user_type }, 
            meta: meta,
            summary: `${updater.first_name} ${updater.last_name} (${updater.role} → ${updater.user_type}) created a plan ${label.trim()}`,
            fn: async () => {

                const sanitized = {
                    label: label.trim(),
                    duration: duration.trim(),
                    duration_days: Number(duration_days),
                    status: "active",
                    createdAt: new Date(),
                    createdBy: new ObjectId(adminId),
                    updatedAt: null,
                    updatedBy: null,
                    archivedAt: null,
                    archivedBy: null
                }
    
                return await PlanModel.createPlans(sanitized);
            }
        });
    }
    
    async viewAllPlans(query) {
        let { status, label, page = 1, limit = 10 } = query;

        page = Number(page)
        limit = Number(limit)
    
        const filter = {};
    
        if(status) {
            filter.status = status.trim().toLowerCase();
        }
    
        if(label) {
            filter.label = label.trim().toLowerCase();
        }
    
        return await PlanModel.viewAllPlans(filter, page, limit);
    }
    
    async viewAPlan(id) {
        if(!id || !ObjectId.isValid(id)) throw new ValidationError("Missing plan id");
                
        const sanitized = new ObjectId(id);
    
        return await PlanModel.viewAPlan(sanitized);
    }
    
    async updatePlan(id, meta, body, updater) {
        let adminId = updater.id;
    
        if(!id || !ObjectId.isValid(id)) {
            throw new ValidationError("Invalid plan id");
        }
    
        if(!adminId || !ObjectId.isValid(adminId)) {
            throw new ValidationError("Invalid admin Id");
        }
    
        const plan_id = new ObjectId(id);
        const Exist = await PlanModel.viewAPlan(plan_id);
        if(!Exist) {
            throw new ValidationError("No plan found");
        }
    
        const { label, duration_days, duration } = body;
    
        const sanitized = {};
        if(label) sanitized.label = label.trim();
        if(duration_days) sanitized.duration_days = Number(duration_days);
        if(duration) sanitized.duration = duration.trim()
    
        sanitized.updatedAt = new Date();
        sanitized.updatedBy = new ObjectId(adminId);

        return await AuditLogsService.auditWrap({
            action: "PLAN_UPDATE",
            entity: "plans",
            actor: { id: adminId, role: updater.role, user_type: updater.user_type }, 
            meta: meta,
            summary: `${updater.first_name} ${updater.last_name} (${updater.role} → ${updater.user_type}) updated the plan ${label} to ${sanitized.name} ${sanitized.label}`,
            changes: { 
                patch: {
                    before: {
                        label: Exist.label,
                        duration_days: Exist.duration_days,
                        duration: Exist.duration
                    },
                    after: {
                        label: sanitized.label ?? Exist.label,
                        duration_days: sanitized.duration_days ?? Exist.duration_days,
                        duration: sanitized.duration ?? Exist.duration
                    }
                } 
            },
            fn: async () => {
                return await PlanModel.updatePlan(plan_id, sanitized);
            }
        });
    }
    
    async updatePlanStatus(id, meta, status, updater) {
        let adminId = updater.id;
                
        if(!id || !ObjectId.isValid(id)) {
            throw new ValidationError("Invalid plan id");
        }
    
        if(!adminId || !ObjectId.isValid(adminId)) {
            throw new ValidationError("Invalid admin Id");
        }
    
        const plan_id = new ObjectId(id);
        adminId = new ObjectId(adminId);

        const ifExist = await PlanModel.viewAPlan(plan_id);
        if(!ifExist) {
            throw new ValidationError("No plan exist");
        }
    
        if(!status) {
            throw new ValidationError("Missing status change value");
        }
    
        const allowedStatus = ["active", "inactive", "archived"];
        if(!allowedStatus.includes(status)) {
            throw new ValidationError("Invalid status value");
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
        
        return await AuditLogsService.auditWrap({
            action: "PLAN_UPDATE",
            entity: "plans",
            entity_id: new ObjectId(id),
            actor: { id: adminId, role: updater.role, user_type: updater.user_type  }, 
            meta: meta,
            summary: `${updater.first_name} ${updater.last_name} (${updater.role} → ${updater.user_type}) updated the plan ${ifExist.label} plan  status to ${status}`,
            changes: { 
                patch: {
                    before: {
                        status: ifExist.status
                    },
                    after: {
                        status: sanitized.status
                    }
                } 
            },
            fn: async () => {
                return await PlanModel.updatePlanStatus(plan_id, sanitized);
            }
        });
    }
}

export default new PlanService();