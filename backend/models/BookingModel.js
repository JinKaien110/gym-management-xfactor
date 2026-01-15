import { ObjectId } from "mongodb";
import { connectDB } from "../config/db.js";
import { ValidationError } from "../errors/ValidationError.js";

class BookingModel {
    async joinBooking(req, res, next) {
        
    }

    async viewMyBookings(req, res, next) {
        
    }

    async viewBookingDetails(schedule_id, member_id) {
        const db = await connectDB();

        const result = await db.collection("bookings").findOne({
            schedule_id: schedule_id,
            member_id: member_id,
            status: "joined"
        });

        return result;
    }

    async countJoined(schedule_id) {
        const db = await connectDB();

        const result = await db.collection("bookings").countDocuments({
            schedule_id: schedule_id,
            status: "joined"
        });

        return result;
    }

    async viewAllBooking(req, res, next) {
        
    }

    async cancelBooking(req, res, next) {
        
    }
}

export default new BookingModel();