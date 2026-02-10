import { connectDB } from "../config/db.js";

class DiscountRequestModel {
    async createDiscountRequest(data, session = null) {
        const { db } = await connectDB();

        const result = await db.collection("decision_requests").insertOne(
            data,
            { ...( session ? { session } : {} ) }
        );

        return result;
    }

    async findDiscountRequestById(id) {
        const { db } = await connectDB();

        const result = await db.collection("decision_requests").findOne({ _id: id });

        return result;
    }

    async decisionOnDiscountRequest(id, data, session = null) {
        const { db } = await connectDB();

        const result = await db.collection("decision_requests").findOneAndUpdate(
            { _id: id },
            { $set: data },
            {
                returnDocument: "after",
                ...( session ? { session } : {} )
            }
        );

        return result;
    }
}

export default new DiscountRequestModel();