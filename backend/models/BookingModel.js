import { ObjectId } from "mongodb";
import { connectDB } from "../config/db.js";
import { ValidationError } from "../errors/ValidationError.js";

class BookingModel {
    async joinBooking(data) {
        const { db } = await connectDB();

        const result = await db.collection("bookings").insertOne(data);

        if(!result || !result.acknowledged) {
            throw new ValidationError("Failed to join booking")
        }

        return result;
    }

    async viewMyBookings(id, page, limit) {
        const { db } = await connectDB();

        const result = await db.collection("bookings")
            .find({ member_id: id })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .toArray();

        const total = await db.collection("bookings")
        .countDocuments({ member_id: id })

        return {
            data: result,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }

    async checkIfAlreadyJoined(schedule_id, member_id) {
        const { db } = await connectDB();

        const result = await db.collection("bookings").findOne({
            schedule_id: schedule_id,
            member_id: member_id,
            status: "joined"
        });

        return result;
    }

    async viewBookingDetails(id) {
        const { db } = await connectDB();

        const result = await db.collection("bookings").findOne({
            _id: id
        });

        return result;
    }

    async countJoined(schedule_id) {
        const { db } = await connectDB();

        const result = await db.collection("bookings").countDocuments({
            schedule_id: schedule_id,
            status: "joined"
        });

        return result;
    }

    async viewAllBooking(filter, page, limit) {
        const { db } = await connectDB();

        const skip = (page - 1) * limit

        const [result, total] = await Promise.all([
            db.collection("bookings")
            .aggregate([
                { $match: filter },
                { $sort: { createdAt: -1 } },
                { $skip: skip },
                { $limit: limit }
            ]).toArray(),

            db.collection("bookings")
            .countDocuments(filter)
        ])

        if(!result.length === 0) {
            return {
                result: [],
                page,
                limit,
                totalPages: 0
            }
        }

        return {
            result,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    }

    async cancelBooking(id, data) {
        const { db } = await connectDB();

        const result = await db.collection("bookings").findOneAndUpdate(
            { _id: id },
            { $set: data },
            { returnDocument: "after" }
        );

        if(!result) {
            throw new ValidationError("Failed to cancel bookings")
        }

        return result
    }
}

export default new BookingModel();