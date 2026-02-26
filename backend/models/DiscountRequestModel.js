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

    async findDiscountRequestById(id, session = null) {
        const { db } = await connectDB();
        const result = await db.collection("decision_requests").findOne({ _id: id },
            session ? { session } : {}
        );

        return result;
    }

    async findDiscountRequestByMembershipRequestId(id) {
        const { db } = await connectDB();

        const result = await db.collection("decision_requests").findOne({membership_request_id: id });

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

    async updateMembershipStatusByMembershipRequestId(id, data) {
        const { db } = await connectDB();

        const result = await db.collection("decision_requests").findOneAndUpdate(
            { membership_request_id: id },
            { $set: data },
            { returnDocument: "after" }
        );

        return result;
    }

    async getAllDiscountRequests(filter, page, limit) {
        const { db } = await connectDB();

        const skip = (page - 1) * limit;

        const results = await db.collection("decision_requests").find(filter).skip(skip).limit(limit).toArray();

        const total = await db.collection("decision_requests").countDocuments(filter);

        return {
            data: results,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }
}

export default new DiscountRequestModel();