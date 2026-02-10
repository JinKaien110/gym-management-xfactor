import { connectDB } from "../config/db.js";
import { ObjectId } from "mongodb";
import { debuggerLog } from "../utils/debuggerLog.js";
import { ValidationError } from "../errors/ValidationError.js";

class AdminModel {
    async viewAdmin(id) {
        const { db } = await connectDB();

        const result = await db.collection('member').findOne({ _id: id });

        return result;
    }

    async viewAdminByEmail(email) {
        const { db } = await connectDB();

        const result = await db.collection('member').findOne({ email });

        return result;
    }

    async createAdmin(data) {
        const { db } = await connectDB();

        const result = await db.collection('member').insertOne(data);

        if(!result.acknowledged) throw new ValidationError("Failed to create new admin");

        return {
            result: result.insertedId,
            ...data
        };
    }

    async updatePassword(id, data) {
        const { db } = await connectDB();

        const result = await db.collection('member').findOneAndUpdate(
            { _id: id },
            { $set: data },
            { returnDocument: "after" }
        );

        if(!result) throw new ValidationError("Failed to update admin");

        return result;
    }
    
}

export default new AdminModel();