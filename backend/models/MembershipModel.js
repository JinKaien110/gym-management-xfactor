import { connectDB } from "../config/db.js";
import { ObjectId } from "mongodb";

class MembershipModel {
    async createMembership(data) {
        const db = await connectDB();

        const result = await db.collection("memberships").insertOne(data);

        if(!result || !result.acknowledged) {
            throw new Error("Error inserting membership");
        }
        
        return result;
    }

    async alreadyHaveMembership(id) {
        const db = await connectDB();

        const result = await db.collection("memberships").findOne(
            { member_id: id,
                status: "active"
             }
        );

        return result;
    }

    async viewMembership(id) {
        const db = await connectDB();

        const result = await db.collection("memberships").findOne(
            { _id: id }
        );

        if(!result) {
            throw new Error("Failed to view membership");
        }

        return result;
    }

    async updateMembership(id, data) {
        const db = await connectDB();

        const result = await db.collection("memberships").findOneAndUpdate(
            { _id: id },
            { $set: data },
            { returnDocument: "after"}
        );

        if(!result) {
            throw new Error("Failed to update membership");
        }

        return result;
    }

    async updateMembershipStatus(id, data) {
        const db = await connectDB();

        const result = await db.collection("memberships").findOneAndUpdate(
            { _id: id },
            { $set: data },
            { returnDocument: "after" }
        );

        if(!result) {
            throw new Error("Failed to update membership status");
        }

        if(!result._id) {
            throw new Error("Membership not found");
        }

        return result;
    }

    async freezeMembership(id, data) {
        const db = await connectDB();

        const result = await db.collection("memberships").findOneAndUpdate(
            { _id: id },
            { $set: data },
            { returnDocument: "after" }
        );

        if(!result) {
            throw new Error("Failed to freeze the membership");
        }

        return result;
    }

    async unfreezeMembership(id, data) {
        const db = await connectDB();

        const result = await db.collection("memberships").findOneAndUpdate(
            { _id: id },
            { $set: data },
            { returnDocument: "after" }
        );

        if(!result) {
            throw new Error("Failed to unfreeze the membership");
        }

        return result;
    }
}

export default new MembershipModel()