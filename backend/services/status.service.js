import { ObjectId } from "mongodb";
import AuditLogsService from "./audit.logs.service.js";
import { ValidationError } from "../errors/ValidationError.js";
import StatusModel from "../models/StatusModel.js";

class StatusService {
    async status(collectionName, id, status, meta, updater) {
        if(!id || !ObjectId.isValid(id)) throw new ValidationError("Invalid ID");
        if(!updater.id || !ObjectId.isValid(updater.id)) throw new ValidationError("Invalid updated ID");
        collectionName = String(collectionName).trim().toLowerCase()
        status = String(status).trim().toLowerCase()

        const data = {
            status,
            updatedAt: new Date(),
            updatedBy: new ObjectId(updater.id),
            archivedAt: status === "archived" ? new Date() : null,
            archivedBy: status === "archived" ? new ObjectId(updater.id) : null,
        }

        return await AuditLogsService.auditWrap({
            action: "UPDATE_STATUS",
            entity: collectionName,
            actor: { id: new ObjectId(updater.id), role: updater.role, user_type: updater.user_type }, 
            meta: meta,
            summary: `${updater.first_name} ${updater.last_name} (${updater.role} → ${updater.user_type}) updated the status of ${id.toString()} in ${collectionName}`,
            fn: async () => {
                return await StatusModel.status(collectionName, new ObjectId(id), data)
            }
        });
    }
}

export default new StatusService();