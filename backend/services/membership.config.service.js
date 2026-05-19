
import { connectDB } from "../config/db.js";
import { ValidationError } from "../errors/ValidationError.js";
import { ObjectId } from "mongodb";
import MembershipConfigModel from "../models/MembershipConfigModel.js";
import { getChangedFields } from "../utils/getChangedFields.js";
import AuditLogsService from "./audit.logs.service.js";

class MembershipConfigService {
    async getAll(query) {
        let {
            search,
            duration,
            min_fee,
            max_fee,
            min_days,
            max_days,
            perks,
            page = 1,
            limit = 10,
        } = query;

        page = Number(page);
        limit = Number(limit);

        const filter = {};

        if (search) {
            filter.name = { $regex: search.trim(), $options: "i" };
        }

        if (duration) {
            filter.duration = String(duration).toLowerCase().trim();
        }

        if (min_fee || max_fee) {
            filter.fee = {};
            if (min_fee) filter.fee.$gte = Number(min_fee);
            if (max_fee) filter.fee.$lte = Number(max_fee);
        }

        if (min_days || max_days) {
            filter.duration_days = {};
            if (min_days) filter.duration_days.$gte = Number(min_days);
            if (max_days) filter.duration_days.$lte = Number(max_days);
        }

        if (perks) {
            const perksArray = Array.isArray(perks)
                ? perks
                : [perks];

            filter.perks = {
                $in: perksArray.map(p => String(p).toLowerCase().trim())
            };
        }


        return await MembershipConfigModel.getAll(filter, page, limit);
    }

    async create(meta, body, updater) {
        let { name, perks, fee, duration_days, duration} = body;

        if(!name || !perks || !fee || !duration || !duration_days) throw new ValidationError("Please fill out the necessary fields");

        name = String(name).trim();
        fee = Number(fee);
        perks = Array.isArray(perks) 
        ? perks.map(p => String(p).trim().toLowerCase()) 
        : [String(perks).trim().toLowerCase()];
        duration = String(duration).trim().toLowerCase();
        duration_days = Number(duration_days);
        console.log(duration_days)
        if(!Number.isInteger(duration_days) || duration_days <= 0) throw new ValidationError("Invalid duration days must be positive integer")

        const count = await MembershipConfigModel.count();
        const version = 1 + count;

        const now = new Date();
        const data = {
            name,
            perks,
            fee,
            duration,
            duration_days,
            version,
            createdAt: now,
            createdBy: new ObjectId(updater.id),
            updatedAt: null,
            updatedBy: null,
            archivedAt: null,
            archivedBy: null
        }

        return await AuditLogsService.auditWrap({
            action: "membership_CONFIG_CREATED",
            entity: "membership_config",
            actor: { id: new ObjectId(updater.id), role: updater.role, user_type: updater.user_type }, 
            meta: meta,
            summary: `${updater.first_name} ${updater.last_name} (${updater.role} → ${updater.user_type})created a membership config`,
            fn: async () => {
                return await MembershipConfigModel.create(data)
            }
        });
    }

    async edit(id, meta, body, updater) {
        let { name, perks, fee, duration_days, duration } = body;
        if(!id || !ObjectId.isValid(id)) throw new ValidationError("Invalid membership config ID");

        const membership_config = await MembershipConfigModel.find(new ObjectId(id));
        if(!membership_config) throw new ValidationError("No membership config found");

        const data = {};

        if (name !== undefined) {
            data.name = String(name).trim();
        }

        if (fee !== undefined) {
            data.fee = fee !== null ? Number(fee) : null;
        }

        if (perks !== undefined) {
            data.perks = Array.isArray(perks)
                ? perks.map(p => String(p).trim().toLowerCase())
                : [String(perks).trim().toLowerCase()];
        }

        if (duration !== undefined) {
            data.duration = duration !== null ? String(duration).trim().toLowerCase() : null;
        }

        if (duration_days !== undefined) {
            data.duration_days = duration_days !== null ? Number(duration_days) : null;
        }

        const sanitize = getChangedFields(membership_config, data);

        sanitize.updatedAt = new Date();
        sanitize.updatedBy = new ObjectId(updater.id)
        console.log(sanitize)
        return await AuditLogsService.auditWrap({
            action: "membership_CONFIG_UPDATED",
            entity: "membership_config",
            actor: { id: new ObjectId(updater.id), role: updater.role, user_type: updater.user_type }, 
            meta: meta,
            summary: `${updater.first_name} ${updater.last_name} (${updater.role} → ${updater.user_type})edited a membership config`,
            fn: async () => {
                return await MembershipConfigModel.edit(new ObjectId(id), sanitize)
            }
        });
    }   
}

export default new MembershipConfigService();