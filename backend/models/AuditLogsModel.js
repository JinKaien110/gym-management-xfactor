import { connectDB } from "../config/db.js"

class AuditLogModel {
    async create(doc) {
        const { db } = await connectDB();
        const result = await db.collection("audit_logs").insertOne(doc);

        if(!result?.acknowledged) {
            throw new Error("Failed to create audit log")
        }

        return {
            _id: result.insertedId,
            ...doc
        }
    }

    async view(doc) {

    }

    async list(doc) {

    }
}

export default new AuditLogModel()