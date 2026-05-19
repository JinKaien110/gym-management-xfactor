import { ObjectId } from "mongodb";
import { ValidationError } from "../errors/ValidationError.js";
import { getChangedFields } from "../utils/getChangedFields.js";
import ClassScheduleModel from "../models/ClassScheduleModel.js";
import ClassModel from "../models/ClassModel.js";
import TrainerManagementModel from "../models/TrainerManagementModel.js";
import AuditLogsService from "./audit.logs.service.js";


class ClassScheduleService {
    async createClassSchedule(meta, body, updater) {
        let { class_id, start_at, end_at, capacity, location, notes, trainer_id } = body;


        if(!class_id || !start_at || !end_at ) {
            throw new ValidationError("Please fill out the necessary details");
        }

        start_at = new Date(start_at);
        end_at = new Date(end_at);

        if(Number.isNaN(start_at.getTime())) {
            throw new ValidationError("Invalid start at date format");
        }

        if(Number.isNaN(end_at.getTime())) {
            throw new ValidationError("Invalid end at date format");
        }

        if(end_at <= start_at) {
            throw new ValidationError("End at must not before than start at");
        }

        if(!ObjectId.isValid(class_id)) {
            throw new ValidationError("Invalid class ID");
        }

        if(!ObjectId.isValid(trainer_id)) {
            throw new ValidationError("Invalid trainer ID");
        }

        class_id = new ObjectId(class_id);
        trainer_id = trainer_id ? new ObjectId(trainer_id) : null;

        let trainer = null;
        if(trainer_id) {
            trainer = await TrainerManagementModel.getTrainer(trainer_id);
            if(!trainer) {
                throw new ValidationError("Trainer does not exist");
            }
        }
        

        if(!updater.id || !ObjectId.isValid(updater.id)) {
            throw new ValidationError("Invalid updater ID");
        }

        const alreadyExist = await ClassScheduleModel.checkScheduleIfAlreadyExist(
            new ObjectId(class_id),
            start_at
        );

        if(alreadyExist) {
            throw new ValidationError("Class schedule has already been created")
        };

        const classDocs = await ClassModel.viewClass(new ObjectId(class_id));
        if(!classDocs) {
            throw new ValidationError("Class does not exist")
        }
        if(classDocs.status === "archived") {
            throw new ValidationError("Class is archived");
        }

        let capValue;
        if(capacity === undefined || capacity === null || capacity === "") {
            capValue = Number(classDocs.default_capacity);
        } else {
            capValue = Number(capacity);
            if(Number.isNaN(capValue) || capValue <= 0) {
                throw new ValidationError("Capacity must be a positive number")
            }
        }

        const data = {
            class_id,
            start_at,
            end_at,
            capacity: capValue,
            trainer_id: trainer_id ?? null,
            location: location?.trim() || "6Pack Iron City",
            notes: notes ? String(notes?.trim()) : null,
            status: "open", // closed || cancelled || archived
            createdAt: new Date(),
            createdBy: new ObjectId(updater.id),
            updatedAt: null,
            updatedBy: null,
            archivedAt: null,
            archivedBy: null
        }

        return await AuditLogsService.auditWrap({
            action: "CLASS_SCHEDULE_CREATED",
            entity: "class_schedule",
            actor: { id: new ObjectId(updater.id), role: updater.role, user_type: updater.user_type }, 
            meta: meta,
            summary: `${updater.first_name} ${updater.last_name} created a class schedule for ${classDocs.name}`,
            fn: async () => {
                return await ClassScheduleModel.createClassSchedule(data);
            }
        });
        
     }

    async viewClassSchedule(id) {
        if(!id || !ObjectId.isValid(id)) {
            throw new ValidationError("Invalid class schedule ID");
        }

        return await ClassScheduleModel.viewClassSchedule(new ObjectId(id));
    }
    
    async viewAllClassSchedule(query) {
        let { trainer_id, status, class_id, start_at, day, page = 1, limit = 10 } = query;

        const filter = {};
        page = Number(page);
        limit = Number(limit);

        if(day) {
            const dayNum = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"].indexOf(String(day).trim().toLowerCase());

            if(dayNum === -1) {
                throw new ValidationError("Invalid day value");
            }

            filter.day = dayNum;
        }

        if(trainer_id && !ObjectId.isValid(trainer_id)) {
            throw new ValidationError("Invalid trainer ID");
        }

        if(class_id && !ObjectId.isValid(class_id)) {
            throw new ValidationError("Invalid class ID");
        }

        if(start_at) {
            start_at = new Date(start_at);
            if(Number.isNaN(start_at.getTime())) {
                throw new ValidationError("Start at format is not valid");
            }
        }

        if(trainer_id) filter.trainer_id = new ObjectId(trainer_id);
        if(status) filter.status = status.trim().toLowerCase();
        if(class_id) filter.class_id = new ObjectId(class_id);
        if(start_at) filter.start_at = start_at;
        filter.status = { $in: ["open", "closed"] };

        return await ClassScheduleModel.viewAllClassSchedule(filter, page, limit);
    }
    
    async updateClassSchedule(id, meta, body, updater) {
        let { class_id, trainer_id, location, notes, capacity, start_at, end_at } = body;

        const data = {};

        if(!id || !ObjectId.isValid(id)) {
            throw new ValidationError("Invalid class schedule ID");
        }

        if(!updater.id || !ObjectId.isValid(updater.id)) {
            throw new ValidationError("Invalid updater ID");
        }

        if(class_id && !ObjectId.isValid(class_id)) {
            throw new ValidationError("Invalid class ID");
        }

        if(trainer_id && !ObjectId.isValid(trainer_id)) {
            throw new ValidationError("Invalid trainer ID");
        }

        if(start_at !== undefined) {
            start_at = new Date(start_at);
            if(Number.isNaN(start_at.getTime())) {
                throw new ValidationError("Invalid start at format");
            }
            data.start_at = start_at
        }

        if(end_at !== undefined) {
            end_at = new Date(end_at);
            if(Number.isNaN(end_at.getTime())) {
                throw new ValidationError("Invalid end at format");
            }
            data.end_at = end_at
        } 

        if(capacity !== undefined && capacity !== null && capacity !== "") {
            const cap = Number(capacity);

            if(Number.isNaN(cap)) {
                throw new ValidationError("Capacity must be a number");
            }
            if(cap <= 0) {
                throw new ValidationError("Capacity must be a  postive number")
            }

            data.capacity = cap;
        }

        
        const schedule = await ClassScheduleModel.viewClassSchedule(new ObjectId(id));

        if(!schedule) {
            throw new ValidationError("Class schedule not found");
        }

        const mergedStart = data.start_at ?? schedule.start_at;
        const mergedEnd = data.end_at ?? schedule.end_at;

        if(mergedEnd <= mergedStart) {
            throw new ValidationError("End must be after start at");
        }


        if(["closed", "archived"].includes(schedule.status)) {
            throw new ValidationError("Cannot update closed/archived class schedules");
        }

        if(class_id !== undefined) data.class_id = new ObjectId(class_id);
        if(trainer_id !== undefined) data.trainer_id = new ObjectId(trainer_id);

        if (location !== undefined) data.location = String(location).trim();
        if (notes !== undefined || notes !== null || notes !== "" ||  notes !== "null") data.notes = String(notes).trim();


        const scheduleUpdates = getChangedFields(schedule, data)

        if(Object.keys(scheduleUpdates).length) {
            scheduleUpdates.capacity = Number(scheduleUpdates.capacity) ?? Number(schedule.capacity);
            scheduleUpdates.notes = scheduleUpdates.notes === "null" ? null : scheduleUpdates.notes;
            scheduleUpdates.updatedAt = new Date()
            scheduleUpdates.updatedBy = new ObjectId(updater.id)
        }
        return await AuditLogsService.auditWrap({
            action: "CLASS_SCHEDULE_UPDATE",
            entity: "class_schedule",
            entity_id: new ObjectId(id),
            actor: { id: new ObjectId(updater.id), role: updater.role, user_type: updater.user_type }, 
            meta: meta,
            summary: `${updater.first_name} ${updater.last_name} updated the class schedule ${id.toString()}`,
            changes: {
                patch: {
                    before: schedule,
                    after: scheduleUpdates
                }
            },
            fn: async () => {
                return await ClassScheduleModel.updateClassSchedule(
                    new ObjectId(id),
                    scheduleUpdates
                );
            }
        });
        
    }

    async updateClassScheduleStatus(id, meta, status, updater) {
        if(!id || !ObjectId.isValid(id)) {
            throw new ValidationError("Invalid class schedule ID");
        }

        if(!updater.id || !ObjectId.isValid(updater.id)) {
            throw new ValidationError("Invalid updater ID");
        }

        if(!status) {
            throw new ValidationError("Status value is not defined");
        }

        status = String(status).trim().toLowerCase();

        const allowedStatus = ["open", "closed", "cancelled", "archived"];

        if(!allowedStatus.includes(status)){
            throw new ValidationError("Status value is not allowed");
        }

        const schedule = await ClassScheduleModel.viewClassSchedule(new ObjectId(id));

        if(!schedule) {
            throw new ValidationError("Class schedule does not exist")
        }

        if(status === schedule.status) {
            return status;
        }

        const data = {
            status: String(status).trim().toLowerCase(),
            updatedAt: new Date(),
            updatedBy: new ObjectId(updater.id)
        }

        if(status === "archived") {
            data.archivedAt = new Date();;
            data.archivedBy = new ObjectId(updater.id)
        }
         return await AuditLogsService.auditWrap({
            action: "CLASS_SCHEDULE_UPDATE_STATUS",
            entity: "class_schedule",
            entity_id: new ObjectId(id),
            actor: { id: new ObjectId(updater.id), role: updater.role, user_type: updater.user_type }, 
            meta: meta,
            summary: `${updater.first_name} ${updater.last_name} updated the class schedule ${String(id)}`,
            changes: {
                patch: {
                    before: schedule.status,
                    after: String(status).trim().toLowerCase()
                }
            },
            fn: async () => {
                return await ClassScheduleModel.updateClassScheduleStatus(
                    new ObjectId(id),
                    data
                )
            }
        });
    }

    async viewClassScheduleAssignedToMe(user, query) {
        let { page = 1, limit = 10} = query
        if(!user.id || !ObjectId.isValid(user.id)) {
            throw new ValidationError("Invalid trainer ID")
        }

        page = Number(page);
        limit = Number(limit);
        
        if(user.role !== "trainer") {
            throw new ValidationError("Only trainer can classes schedule assigned to them");
        }

        return await ClassScheduleModel.viewClassScheduleAssignedToMe(
            new ObjectId(user.id),
            page,
            limit
        );
    }
}

export default new ClassScheduleService();