import { ObjectId } from "mongodb";
import { connectDB } from "../config/db.js";

class PaymentModel {
    async createPayment(data) {
        const db = await connectDB();

        const result = await db.collection("payments").insertOne(data);

        if(!result || !result.acknowledged) {
            throw new Error("Failed to create payments");
        }

        return result;
    }

    async updateStatusByExternalID(id, data) {
        const db = await connectDB();

        const result = await db.collection("payments").updateOne(
            { external_id: id },
            { $set: data }
        );

        if(!result) {
            throw new Error("Failed to update the status in payments");
        }

        return result
    }

    async findByExternalID(id) {
        const db = await connectDB();

        const result = await db.collection("payments").findOne({ external_id: id });

        if(!result) {
            throw new Error("Failed to update the status in payments");
        }

        return result
    }
}

export default new PaymentModel();