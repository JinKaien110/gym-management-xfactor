import { connectDB } from "../config/db.js";
import { ObjectId } from "mongodb";
import { debuggerLog } from "../utils/debuggerLog.js";
import { ValidationError } from "../errors/ValidationError.js";

class AdminModel {
    async viewAdmin(id) {
        const { db } = await connectDB();

        const result = await db.collection('admins').findOne(
            { _id: id },
            { projection: { password: 0 } }
        );

        return result;
    }

    async viewAdminByEmail(email) {
        const { db } = await connectDB();

        const result = await db.collection('admins').findOne({ email });

        return result;
    }

    async createAdmin(data) {
        const { db } = await connectDB();

        const result = await db.collection('admins').insertOne(data,
            { projection: { password: 0 } }
        );

        if(!result.acknowledged) throw new ValidationError("Failed to create new admin");

        const { password, ...user } = data
        return {
            _id: result.insertedId,
            ...user
        }
    }

    async updatePassword(id, data) {
        const { db } = await connectDB();

        const result = await db.collection('admins').findOneAndUpdate(
            { _id: id },
            { $set: data },
            { returnDocument: "after" }
        );

        if(!result) throw new ValidationError("Failed to update admin");

        return result;
    }
    
}

export default new AdminModel();