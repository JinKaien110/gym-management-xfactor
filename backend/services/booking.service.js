import { ObjectId } from "mongodb";
import { ValidationError } from "../errors/ValidationError.js";
import BookingModel from "../models/BookingModel.js";
import ClassScheduleModel from "../models/ClassScheduleModel.js";

class BookingService {
    async joinBooking(id, updater) {
        if(!id || !ObjectId.isValid(id)) {
            throw new ValidationError("Invalid class schedule ID");
        }

        if(!updater.id || !ObjectId.isValid(updater.id)) {
            throw new ValidationError("Invalid updater ID");
        }

        const schedule = await ClassScheduleModel.viewClassSchedule(new ObjectId(id));
        if(!schedule) {
            throw new ValidationError("Class schedule not found")
        }

        if(schedule.status !== "open") {
            throw new ValidationError("Class schedule is not open for booking");
        }

        const alreadyJoined = await BookingModel.checkIfAlreadyJoined(
            new ObjectId(id),
            new ObjectId(updater.id)
        );

        if(alreadyJoined) {
            throw new ValidationError("You already joined this class schedule");
        }

        const joinedCount = await BookingModel.countJoined(new ObjectId(id));
        const capacity = schedule.capacity

        if(joinedCount >= capacity) {
            throw new ValidationError("Class schedule is already full");
        }

        const data = {
            schedule_id: new ObjectId(id),
            member_id: new ObjectId(updater.id),
            status: "joined",
            joinedAt: new Date(),
            cancelledAt: null,
            cancelledBy: null,
            cancelReason: null,
            notes: null,
            createdAt: new Date(),
            createdBy: new ObjectId(updater.id),
            updatedAt: null,
            updatedBy: null
        }

        return await BookingModel.joinBooking(data)
    }

    async viewMyBookings(id, page = 1, limit = 10) {
        if(!id || !ObjectId.isValid(id)) {
            throw new ValidationError("Invalid user ID");
        }

        page = Number(page);
        limit = Number(limit);

        if (!Number.isInteger(page) || page < 1) page = 1;
        if (!Number.isInteger(limit) || limit < 1 || limit > 50) limit = 10;


        return await BookingModel.viewMyBookings(
            new ObjectId(id),
            page,
            limit
        );
    }

    async viewBookingDetails(id) {
        if(!id || !ObjectId.isValid(id)) {
            throw new ValidationError("Invalid user ID");
        }

        return await BookingModel.viewBookingDetails(new ObjectId(id));
    }

    async viewAllBooking(query) {
        let { member_id, status, page = 1, limit = 10 } = query;

        page = Number(page);
        limit = Number(limit);

        if (!Number.isInteger(page) || page < 1) page = 1;
        if (!Number.isInteger(limit) || limit < 1 || limit > 50) limit = 10;

        const filter = {};

        if(member_id && !ObjectId.isValid(member_id)) {
            throw new ValidationError("Invalid member ID");
        }

        if(member_id) filter.member_id = new ObjectId(member_id);

        status = status ? String(status).trim().toLowerCase(): undefined

        const allowedStatus = ["joined", "cancelled", "no_show"]

        if(status && !allowedStatus.includes(status)) {
            throw new ValidationError("Status value is not allowed")
        }

        if(status) filter.status = status

        return await BookingModel.viewAllBooking(filter, page, limit)
    }

    async cancelBooking(id, body, updater) {
        if(!id || !ObjectId.isValid(id)) {
            throw new ValidationError("Invalid booking ID");
        }

        if(!updater.id || !ObjectId.isValid(updater.id)) {
            throw new ValidationError("Invalid updater ID");
        }

        const booking = await BookingModel.viewBookingDetails(new ObjectId(id));

        if(!booking) {
            throw new ValidationError("Booking not found")
        }

        if(!booking.member_id.equals(new ObjectId(updater.id))) {
            throw new ValidationError("You are not allowed to cancel this booking");
        }

        if(booking.status !== "joined") {
            throw new ValidationError("Booking cannot be cancelled")
        }

        let reason = null;
        if(body?.cancelReason !== undefined && body.cancelReason !== null) {
            const r = String(body.cancelReason).trim();
            if (r) reason = r
        }

        const data = {
            status: "cancelled",
            cancelledAt: new Date(),
            cancelledBy: new ObjectId(updater.id),
            cancelReason: reason,
            updatedAt: new Date(),
            updatedBy: new ObjectId(updater.id)
        }

        return await BookingModel.cancelBooking(
            new ObjectId(id),
            data
        )
    }
}

export default new BookingService();