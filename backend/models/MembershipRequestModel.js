import { ObjectId } from "mongodb";
import { connectDB } from "../config/db.js";
import { ValidationError } from "../errors/ValidationError.js";

class MembershipRequestModel {
    async findMembershipByRequestId(id, session = null) {
        const { db } = await connectDB();

        const result = await db.collection("memberships_request").findOne(
            { _id: id },
            {...( session ? { session } : {})}
        );

        if(!result) {
            throw new ValidationError("Unable to find membership request");
        }

        return result;
    }

    async findMembershipRequestByMemberId(id, session = null) {
        const { db } = await connectDB();

        const result = await db.collection("memberships_request").find(
            { member_id: id },
            {...( session ? { session } : {})}
        )
        .sort({ createdAt: -1 })
        .limit(1)
        .toArray();

        return result[0];
    }
    

    async createMembershipRequest(data, session = null) {
        const { db } = await connectDB();

        const result = await db.collection("memberships_request").insertOne(
            data,
            { ...(session ? { session } : {} ) }
        );

        if(!result || !result.acknowledged) {
            throw new ValidationError("Error inserting membership");
        }
        
        return {
            _id: result.insertedId,
            ...data
        };
    }

    async updateMembershipStatus(id, data, session = null) {
        const { db } = await connectDB();

        const result = await db.collection("memberships_request").findOneAndUpdate(
            { _id: id },
            { $set: data },
            { 
                returnDocument: "after",
                ...( session ? { session } : {})
            }
        );

        if(!result) {
            throw new ValidationError("Failed to update membership request status");
        }
        
        return result;
    }

    async fetchAllMembershipRequests(filter, search, page, limit) {
        const { db } = await connectDB();

        page = Number(page);
        limit = Number(limit);
        
        if (!Number.isInteger(page) || page < 1) page = 1;
        if (!Number.isInteger(limit) || limit < 1 || limit > 50) limit = 10;

        const skip = (page - 1) * limit;

        // Build the aggregation pipeline with lookups
        const pipeline = [
            { $match: filter },
            
            // Sort by newest first (descending by createdAt)
            { $sort: { createdAt: -1 } },
            
            // Lookup member data
            {
                $lookup: {
                    from: "members",
                    localField: "member_id",
                    foreignField: "_id",
                    as: "member"
                }
            },
            { $unwind: { path: "$member", preserveNullAndEmptyArrays: true } },
            
            // Lookup plan data
            {
                $lookup: {
                    from: "plans",
                    localField: "plan_id",
                    foreignField: "_id",
                    as: "plan"
                }
            },
            { $unwind: { path: "$plan", preserveNullAndEmptyArrays: true } },
            
            // Lookup pricing data
            {
                $lookup: {
                    from: "pricing",
                    localField: "pricing_id",
                    foreignField: "_id",
                    as: "pricing"
                }
            },
            { $unwind: { path: "$pricing", preserveNullAndEmptyArrays: true } },
        ];

        // Add search if provided
        if(search && search.trim().length > 0) {
            pipeline.push({
                $match: {
                    $or: [
                        { "member.first_name": { $regex: search, $options: "i" } },
                        { "member.last_name": { $regex: search, $options: "i" } },
                        { "member.email": { $regex: search, $options: "i" } },
                    ]
                }
            });
        }

        // Add pagination
        pipeline.push(
            { $skip: skip },
            { $limit: limit }
        );

        const results = await db.collection("memberships_request").aggregate(pipeline).toArray();

        // Get total count
        const countPipeline = [
            { $match: filter },
            {
                $lookup: {
                    from: "members",
                    localField: "member_id",
                    foreignField: "_id",
                    as: "member"
                }
            },
            { $unwind: { path: "$member", preserveNullAndEmptyArrays: true } },
        ];
        
        if(search && search.trim().length > 0) {
            countPipeline.push({
                $match: {
                    $or: [
                        { "member.first_name": { $regex: search, $options: "i" } },
                        { "member.last_name": { $regex: search, $options: "i" } },
                        { "member.email": { $regex: search, $options: "i" } },
                    ]
                }
            });
        }
        
        countPipeline.push({ $count: "count" });
        
        const countResult = await db.collection("memberships_request").aggregate(countPipeline).toArray();
        const total = countResult[0]?.count || 0;

        return {
            data: results,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }
}

export default new MembershipRequestModel();