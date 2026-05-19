import { connectDB } from "../config/db.js";
import { ValidationError } from "../errors/ValidationError.js";
import { ObjectId } from "mongodb";

class ClientPassModel {

    async createclientPass(data) {
        const { db } = await connectDB();
        const result = await db.collection("clients_pass").insertOne(data);

        if(!result || !result.acknowledged) {
            throw new ValidationError("Failed to create client pass");
        }
        return result;
    }

    async findclientPass(id) {
        const { db } = await connectDB();
        const result = await db.collection("clients_pass").findOne(
            { _id: new ObjectId(id) }
        );
        return result;  
    }

    async findActiveclientPass(id) {
        const { db } = await connectDB();
        const today = new Date();
        const result = await db.collection("clients_pass").findOne(
            { 
                client_id: new ObjectId(id),
                start_date: { $lte: today },
                end_date: { $gte: today },
                status: "active"
            }
        );
        return result;  
    }

    async findclientPassByPaymentId(payment_id) {
        const { db } = await connectDB();
        const result = await db.collection("clients_pass").findOne(
            { payment_id: payment_id }
        );
        return result;
    }   

    async findAllclientPass(filter, page, limit) {
        const { db } = await connectDB();
        const skip = (page - 1) * limit;
        const result = await db.collection("clients_pass").aggregate([
            { $match: filter },
            {
                $lookup: {
                    from: "plans",
                    localField: "plan_id",
                    foreignField: "_id",
                    as: "plan"
                }
            },
            {
                $unwind: {
                    path: "$plan",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "pricing",
                    localField: "pricing_id",
                    foreignField: "_id",
                    as: "pricing"
                }
            },
            {
                $unwind: {
                    path: "$pricing",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "payments",
                    localField: "payment_id",
                    foreignField: "_id",
                    as: "payment"
                }
            },
            {
                $unwind: {
                    path: "$payment",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "clients",
                    localField: "client_id",
                    foreignField: "_id",
                    as: "client"
                }
            },
            {
                $unwind: { path: "$client", preserveNullAndEmptyArrays: true }
            },
            {
                $project: {
                    _id: 1,
                    plan_id: 1,
                    pricing_id: 1,
                    start_date: 1,
                    end_date: 1,
                    payment_id: 1,
                    reference_no: 1,
                    status: 1,
                    createdAt: 1,
                    createdBy: 1,
                    updatedAt: 1,
                    updatedBy: 1,
                    archivedAt: 1,
                    archivedBy: 1,
                    client: {
                        _id: "$client._id",
                        first_name: "$client.first_name",
                        last_name: "$client.last_name",
                        email: "$client.email",
                        is_discounted: "$client.is_discounted",
                        phone: "$client.phone",
                    }
                }
            },
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limit },
        ]);

        return result;
    }

    async countToday() {
        const { db } = await connectDB();

        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');

        const start = new Date(`${yyyy}-${mm}-${dd}T00:00:00Z`);
        const end = new Date(`${yyyy}-${mm}-${dd}T23:59:59Z`);

        return await db.collection("clients_pass").countDocuments({ created_at: { $gte: start, $lte: end } });
    }

    async updateclientPassStatus(id, data) {
        const { db } = await connectDB();
               
        const result = await db.collection("clients_pass").findOneAndUpdate(
            { payment_id: id },
            { $set: data },
            { returnDocument: "after" }
        );
    
        if(!result) throw new ValidationError("Failed to update client pass status");
        return result;
    }
}

export default new ClientPassModel();