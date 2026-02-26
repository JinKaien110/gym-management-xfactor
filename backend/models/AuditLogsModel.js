import { connectDB } from "../config/db.js"
import { ValidationError } from "../errors/ValidationError.js";

class AuditLogModel {
    async create(doc) {
        const { db } = await connectDB();
        const result = await db.collection("audit_logs").insertOne(doc);

        if(!result?.acknowledged) {
            throw new ValidationError("Failed to create audit log")
        }

        return {
            _id: result.insertedId,
            ...doc
        }
    }

    async showAuditLogs(filter, page, limit) {
        const { db } = await connectDB();

        const skip = (page - 1) * limit;

        const [items, total] = await Promise.all([
            db.collection("audit_logs")
            .find(filter)
            .sort({ createdAt: -1 })     
            .skip(skip)
            .limit(limit)
            .toArray(),

            db.collection("audit_logs").countDocuments(filter)
        ]);

        return {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            items
        };
    }

    async viewOneAuditLog(id) {
        const { db } = await connectDB();

        const result = await db.collection("audit_logs").findOne({ _id: id });

        return result;
    }
}

export default new AuditLogModel()