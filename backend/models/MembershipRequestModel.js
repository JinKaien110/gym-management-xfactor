import { ObjectId } from "mongodb";
import { connectDB } from "../config/db.js";

class MembershipRequestModel {
    async findMembershipByRequestId(id) {
        const db = await connectDB();

        const result = await db.collection("memberships_request").findOne({ _id: id });

        if(!result) {
            throw new Error("Unable to find membership request");
        }

        return result;
    }

    async createMembershipRequest(data) {
        const db = await connectDB();

        const result = await db.collection("memberships_request").insertOne(data);

        if(!result || !result.acknowledged) {
            throw new Error("Error inserting membership");
        }
        
        return {
            _id: result.insertedId,
            ...data
        };
    }

    async updateMembershipStatus(id, status) {
        const db = await connectDB();

        const result = await db.collection("memberships_request").findOneAndUpdate(
            { _id: id },
            { $set: { status: status} },
            { returnDocument: "after" }
        );

        if(!result) {
            throw new Error("Failed to update membership request status");
        }
        
        return result;
    }
}

export default new MembershipRequestModel();