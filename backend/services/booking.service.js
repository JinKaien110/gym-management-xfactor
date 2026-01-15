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

        const alreadyJoined = await BookingModel.viewBookingDetails(
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

    async viewMyBookings(req, res, next) {
        
    }

    async viewBookingDetails() {
        
    }

    async viewAllBooking(req, res, next) {
        
    }

    async cancelBooking(req, res, next) {
        
    }
}

export default new BookingService();