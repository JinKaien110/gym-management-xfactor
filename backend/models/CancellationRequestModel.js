import { connectDB } from "../config/db.js";
import { ObjectId } from "mongodb";

class CancellationRequestModel {
    async read(id) {
        const db = await connectDB();

        const result = await db.collection("membership_cancellation_requests").findOne({ _id: id });

        return result;
    }

    async create(data) {
        const db = await connectDB();

        const result = await db.collection("membership_cancellation_requests").insertOne(data);
        
        if(!result || !result.acknowledged) {
            throw new Error("Failed to request m,membership cancellation");
        }

        return result;
    }

    async update(id, data) {
        const db = await connectDB();

        const result = await db.collection("membership_cancellation_requests").findOneAndUpdate(
            { _id: id },
            { $set: data },
            { returnDocument: "after"}
        );

        if(!result) {
            throw new Error("Failed to update membership cancellation");
        }

        return result;
    }
}

export default new CancellationRequestModel();