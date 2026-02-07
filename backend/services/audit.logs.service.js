import AuditLogsModel from "../models/AuditLogsModel.js";
import dotenv from "dotenv"
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
}

export default new AuditLogService();