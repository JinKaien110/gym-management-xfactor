import { connectDB } from "../config/db.js";

class DiscountRequestModel {
    async createDiscountRequest(data, session = null) {
        const { db } = await connectDB();

        const result = await db.collection("discount_requests").insertOne(
            data,
            { ...( session ? { session } : {} ) }
        );

        return result;
    }

    async findDiscountRequestById(id, session = null) {
        const { db } = await connectDB();
        const result = await db.collection("discount_requests").findOne({ _id: id },
            session ? { session } : {}
        );

        return result;
    }

    async findDiscountRequestByClientId(clientId) {
        const { db } = await connectDB();
        const result = await db.collection("discount_requests").findOne({ client_id: clientId },
            { sort: { createdAt: -1 } }
        );

        return result;
    }
    
    async findDiscountRequestBymembershipRequestId(id) {
        const { db } = await connectDB();

        const result = await db.collection("discount_requests").findOne({membership_request_id: id });

        return result;
    }

    async decisionOnDiscountRequest(id, data, session = null) {
        const { db } = await connectDB();

        const result = await db.collection("discount_requests").findOneAndUpdate(
            { _id: id },
            { $set: data },
            {
                returnDocument: "after",
                ...( session ? { session } : {} )
            }
        );
        return result;
    }

    async updatemembershipStatusBymembershipRequestId(id, data) {
        const { db } = await connectDB();

        const result = await db.collection("discount_requests").findOneAndUpdate(
            { membership_request_id: id },
            { $set: data },
            { returnDocument: "after" }
        );

        return result;
    }

    async getAllDiscountRequests(filter, page, limit) {
        const { db } = await connectDB();

        const skip = (page - 1) * limit;

        const results = await db.collection("discount_requests").find(filter).skip(skip).limit(limit).toArray();

        const total = await db.collection("discount_requests").countDocuments(filter);

        return {
            data: results,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }

    async findDiscountRequestByclientId(id) {
        const { db } = await connectDB();

        const result = await db.collection("discount_requests").findOne(
            { client_id: id, status: "pending" },
            { sort: { createdAt: -1 } }
        );

        return result;
    }

}

export default new DiscountRequestModel();