import { ObjectId } from "mongodb";
import { ValidationError } from "../errors/ValidationError.js";
import BookingModel from "../models/BookingModel.js";
import ClassScheduleModel from "../models/ClassScheduleModel.js";
import ClassModel from "../models/ClassModel.js";
import MemberModel from "../models/MemberModel.js";
import TrainerManagementModel from "../models/TrainerManagementModel.js";
import { memberJoinBookingEmail } from "../templates/booking/email.memberJoinBooking.js";
import AuditLogsService from "./audit.logs.service.js"; 
import { sendEmail } from "./email.service.js";
import { memberCancelBookingEmail } from "../templates/booking/emaill.memberCancelBooking.js";
class BookingService {
    async joinBooking(id, meta, updater) {
        if(!id || !ObjectId.isValid(id)) {
            throw new ValidationError("Invalid class schedule ID");
        }

        if(!updater.id || !ObjectId.isValid(updater.id)) {
            throw new ValidationError("Invalid member ID");
        }



        const schedule = await ClassScheduleModel.viewClassSchedule(new ObjectId(id));
        if(!schedule) {
            throw new ValidationError("Class schedule not found")
        }

        const classes = await ClassModel.viewClass(new ObjectId(schedule.class_id))

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

        const trainer = await TrainerManagementModel.findTrainerById(new ObjectId(schedule.trainer_id))

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

        const email = {
            first_name: updater.first_name,
            last_name: updater.last_name,
            status: "joined",
            name: classes.name,
            trainer_first_name: trainer.first_name,
            trainer_last_name: trainer.last_name,
            start_at: schedule.start_at,
            location: schedule.location,
            notes: schedule.notes
        }

        return await AuditLogsService.auditWrap({
            action: "BOOKING_MEMBER_JOIN",
            entity: "bookings",
            entity_id: new ObjectId(id),
            actor: { id: new ObjectId(updater.id), role: updater.role, user_type: updater.user_type  }, 
            meta: meta,
            summary: `${updater.first_name} ${updater.last_name} (${updater.role} → ${updater.user_type}) book the class ${classes.label}`,
            fn: async () => {
                await AuditLogsService.auditWrap({
                    action: "EMAIL_MEMBER_JOINBOOKING",
                    entity: "admins",
                    actor: { id: new ObjectId(updater.id), role: updater.role, user_type: updater.user_type }, 
                    meta: meta,
                    summary: `${updater.first_name} ${updater.last_name} (${updater.role} → ${updater.user_type}) has been sent an email confirmation about booking a ${classes.label} class schedule`,
                    fn: async () => {
                        return await sendEmail({
                            to: updater.email,
                            subject: "XFactor Fitness Gym Trece - Booking Confirmation",
                            html: memberJoinBookingEmail(email)
                        });
                    }
                })
                return await BookingModel.joinBooking(data)
            }
        });
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

    async cancelBooking(id, meta, body, updater) {
        if(!id || !ObjectId.isValid(id)) {
            throw new ValidationError("Invalid booking ID");
        }

        if(!updater.id || !ObjectId.isValid(updater.id)) {
            throw new ValidationError("Invalid updater ID");
        }

        const booking = await BookingModel.viewBookingDetails(new ObjectId(id));

        const schedule = await ClassScheduleModel.viewClassSchedule(new ObjectId(booking.schedule_id))

        const classes = await ClassModel.viewClass(new ObjectId(schedule.class_id))

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

        const email = {
            first_name: updater.first_name,
            last_name: updater.last_name,
            status: "cancelled",
            name: classes.name,
            reason: reason ?? null
        }

        return await AuditLogsService.auditWrap({
            action: "BOOKING_MEMBER_CANCEL",
            entity: "bookings",
            entity_id: new ObjectId(id),
            actor: { id: new ObjectId(updater.id), role: updater.role, user_type: updater.user_type }, 
            meta: meta,
            summary: `${updater.first_name} ${updater.last_name} (${updater.role} → ${updater.user_type}) cancel his booking in the class ${classes.name}`,
            changes: {
                patch: {
                    before: {
                        status: booking.status
                    }, 
                    after: {
                        status: "cancelled"
                    },
                    reason
                }
            },
            fn: async () => {
                await AuditLogsService.auditWrap({
                    action: "EMAIL_MEMBER_CANCELBOOKING",
                    entity: "members",
                    entity_id: new ObjectId(updater._id) ?? null,
                    actor: { id: new ObjectId(updater.id), role: updater.role, user_type: updater.user_type }, 
                    meta: meta,
                    summary: `${updater.first_name} ${updater.last_name} (${updater.role} → ${updater.user_type}) has been sent a cancellation booking of ${classes.label}`,
                    fn: async () => {
                        return await sendEmail({
                            to: updater.email,
                            subject: "XFactor Fitness Gym Trece - Booking Cancellation Confirmation",
                            html: memberCancelBookingEmail(email)
                        });
                    }
                })
                return await BookingModel.cancelBooking(
                    new ObjectId(id),
                    data
                )
            }
        });
    }
}

export default new BookingService();