import AuditLogsModel from "../models/AuditLogsModel.js";
import dotenv from "dotenv";
import { ObjectId } from "mongodb";
import { ValidationError } from "../errors/ValidationError.js";
import AdminModel from "../models/AdminModel.js";
import ClientModel from "../models/ClientModel.js";
import TrainerManagementModel from "../models/TrainerManagementModel.js";
dotenv.config()

class AuditLogService {
    async log({
        action,
        entity,
        entity_id,
        actor,
        summary,
        status,
        error,
        meta,
        changes,
    }) {
        const doc = {
        action,
        entity,
        entity_id,
        actor,
        summary,
        status,
        error,
        meta,
        changes,
        createdAt: new Date(),
        };

        return await AuditLogsModel.create(doc);
    }

    async auditWrap({
        action,
        entity,
        actor,
        meta,
        summary,
        entity_id = null,
        changes = null,
        fn,
    }) {
        try {
            const result = await fn();

            const finalEntityId = entity_id ?? result?.insertedId ?? result?._id ?? null;

            await this.log({
            action,
            entity,
            entity_id: finalEntityId,
            actor,
            summary,
            status: "success",
            meta,
            changes,
            error: null,
            });

            return result;
        } catch (err) {
            await this.log({
                action,
                entity,
                entity_id,
                actor,
                summary: summary || `${action} failed`,
                status: "fail",
                meta,
                changes,
                error: {
                    message: err?.message || "Unknown error",
                    code: err?.code || err?.name || "ERROR",
                    ...(process.env.NODE_ENV === "development" ? { stack: err?.stack } : {}),
                },
            });
            throw err;
        }
    }

    async showAuditLogs(query, user) {
        let {
            action,
            entity,
            actor_id,
            actor_role,
            start_date,
            end_date,
            page = 1,
            limit = 25,
        } = query;
        console.log(limit)

        if (!user?.id || !ObjectId.isValid(user.id)) {
            throw new ValidationError("Invalid admin ID");
        }

        const adminChecker = await AdminModel.viewAdmin(new ObjectId(user.id));
        if (!adminChecker) {
            throw new ValidationError("No admin found");
        }


        page = Math.max(1, Number(page) || 1);
        limit = Math.min(100, Math.max(1, Number(limit) || 25));

        const filter = {};

        if (action) {
            filter.action = String(action).trim().toUpperCase();
        }

        if (entity) {
            filter.entity = String(entity).trim().toLowerCase();
        }

        if (actor_id) {
            if (!ObjectId.isValid(actor_id)) {
            throw new ValidationError("Invalid actor_id");
            }
            filter["actor.id"] = new ObjectId(actor_id);
        }

        if (actor_role) {
            filter["actor.role"] = String(actor_role).trim().toLowerCase();
        }

        if (start_date || end_date) {
            const range = {};

            if (start_date) {
            const d = new Date(start_date);
            if (isNaN(d.getTime())) throw new ValidationError("Invalid start_date");
            range.$gte = d;
            }

            if (end_date) {
            const d = new Date(end_date);
            if (isNaN(d.getTime())) throw new ValidationError("Invalid end_date");
            range.$lte = d;
            }

            filter.createdAt = range;
        }
        
        return await AuditLogsModel.showAuditLogs(filter, page, limit);
    }

    async viewOneAuditLog(id, user) {
        if(!id || !ObjectId.isValid(id)) throw new ValidationError("Invalid audit log ID");
        if(!user.id || !ObjectId.isValid(user.id)) throw new ValidationError("Invalid admin ID");

        const allowedRoles = ["admin", "superadmin"];
        if(!allowedRoles.includes(user.role)) {
            throw new ValidationError("Forbidden: Not Authorized");
        }

        return await AuditLogsModel.viewOneAuditLog(new ObjectId(id));
    }
}

export default new AuditLogService();