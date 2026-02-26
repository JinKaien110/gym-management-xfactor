import { ChangeStream, ObjectId } from "mongodb";
import dotenv from "dotenv";
import TrainerManagementModel from "../models/TrainerManagementModel.js";
import { hashedPassword } from "../utils/hashedPassword.js";
import checkDuplicate from "../utils/checkDuplicate.js";
import { getChangedFields } from "../utils/getChangedFields.js";
import MemberModel from "../models/MemberModel.js";
import { ValidationError } from "../errors/ValidationError.js";
import { connectDB } from "../config/db.js";
import { memberAssignedToTrainerEmail } from "../templates/assignment/email.memberAssignedToTrainer.js";
import { sendEmail } from "./email.service.js";


class TrainerService {
    async createTrainer(meta, body, updater) {
        let { first_name, last_name, email, phone, password, specialization, certification, availability, assigned_members, max_members } = body;
        let creator = updater.id;

        if(!first_name || !last_name || !email || !phone || !password || !specialization || !availability || !max_members  ) {
            throw new ValidationError("Please fill out the necessary fields");
        }

        if(isNaN(max_members)) {
            throw new ValidationError("Max members should be numerical");
        }

        if(!creator || !ObjectId.isValid(creator)) {
            throw new ValidationError("Invalid admin ID");
        }

        const hashpw = await hashedPassword(password);

        const sanitized = {
            first_name: first_name.trim(),
            last_name: last_name.trim(),
            email: email.trim(),
            phone: phone.trim(),
            password: hashpw,
            role: "trainer",
            status: "active",
            specialization: Array.isArray(specialization)
                ? specialization.map(s => s.trim().toLowerCase())
                : [specialization.trim().toLowerCase()],
            certification: certification?.trim(),
            availability: {
                days: Array.isArray(availability.days) 
                    ? availability.days.map(d => String(d).trim().toLowerCase())
                    : [String(availability.days).trim().toLowerCase()],
                time_from: String(availability.time_from).trim(),
                time_to: String(availability.time_to).trim()
            },
            assigned_members: [],
            max_members: Number(max_members),
            createdAt: new Date(),
            createdBy: new ObjectId(creator),
            updatedAt: new Date(),
            updatedBy: new ObjectId(creator),
            archivedAt: null,
            archivedBy: null
        }

        return await AuditLogsService.auditWrap({
            action: "TRAINER_CREATED",
            entity: "trainers",
            actor: { id: new ObjectId(updater.id), role: updater.role, user_type: updater.user_type }, 
            meta: meta,
            summary: `${updater.first_name} ${updater.last_name} (${updater.role} → ${updater.user_type}) created trainer ${first_name} ${last_name}`,
            fn: async () => {
                await AuditLogsService.auditWrap({
                    action: "EMAIL_TRAINER_CREATED",
                    entity: "trainers",
                    actor: { id: new ObjectId(updater.id), role: updater.role, user_type: updater.user_type }, 
                    meta: meta,
                    summary: `${updater.first_name} ${updater.last_name} (${updater.role} → ${updater.user_type}) has been sent an email notification about trainer credentials `,
                    fn: async () => {
                        await sendEmail({
                            to: member.email,
                            subject: "XFactor Fitness Gym Trece - Welcome to XFactor Fitness Trece",
                            html: memberRegisteredEmail(member)
                        });
                    }
                })
                return await TrainerManagementModel.createTrainer(sanitized);
            }
        });
       
    }

    async listTrainers(query) {
        let { status, specialization, search, page = 1, limit = 10} = query;

        const allowedStatus = ["active", "inactive", "archived"];

        if(status && !allowedStatus.includes(status)) {
            throw new ValidationError("Invalid status");
        }

        page = Number(page);
        limit = Number(limit);

        let filter = {

        }

        if(status) {
            filter.status = status.trim().toLowerCase()
        }

        if(specialization) {
            filter.specialization = specialization.trim().toLowerCase()
        }

        if(search) {
            filter.$or = [
                { first_name : { $regex: search, $options: "i" } },
                { last_name : { $regex: search, $options: "i" } }
            ];
        }

        return TrainerManagementModel.listTrainers(filter, page, limit);
    }

    async getTrainer(id) {
        if(!id || !ObjectId.isValid(id)) {
            throw new ValidationError("Invalid trainer ID");
        }

        return await TrainerManagementModel.getTrainer(new ObjectId(id));
    }

    async updateTrainerProfile(id, meta, body, updater) {
        if(!id || !ObjectId.isValid(id)) {
            throw new ValidationError("Invalid trainer ID");
        }

        if(!updater.id || !ObjectId.isValid(updater.id)) {
            throw new ValidationError("Invalid updater ID");
        }

        await checkDuplicate(id, {
            email: body.email?.trim(),
            phone: body.phone?.trim()
        });

        let allowedFields = [];

        if(updater.role === "staff") {
            allowedFields = [
                "availability",
            ];
        }

        if(updater.role === "admin") {
            allowedFields = [
                "first_name",
                "last_name",
                "email",
                "phone",
                "availability",
                "specialization",
                "max_members"
            ];
        }

        if(!allowedFields.length) {
            throw new ValidationError("Unauthorized role");
        }

         const existingTrainer = await TrainerManagementModel.getTrainer(new ObjectId(id));

        const updateData = {};

        const fieldTypes = {
            first_name: "string",
            last_name: "string",
            email: "string",
            phone: "string",
            specialization: "array",
            availability: "object",
            max_members: "number",
        }

        for (const key of allowedFields) {
            const value = body[key];
            if(value !== undefined) {
                updateData[key] = body[key];

                if(fieldTypes[key] === "string") {
                    updateData[key] = String(value).trim();
                } else if (fieldTypes[key] === "number") {
                    const num = Number(value);
                    if(Number.isNaN(num)) {
                        throw new ValidationError(`${key} must be a number`)
                    }
                    updateData[key] = num;
                } else if (fieldTypes[key] === "array") {
                    if(!Array.isArray(value)) {
                        throw new ValidationError(`${key} must be an array`);
                    }
                    updateData[key] = value.map(v => typeof v === "string" ? v.trim().toLowerCase() : v);
                } else if (fieldTypes[key] === "object") {
                    if(typeof value !== "object") {
                        throw new ValidationError(`${key} must be an object`);
                    }
                    if(key === "availability") {
                        const existingAvailability = existingTrainer.availability || {};
                        
                        const { time_from, time_to, days } = value;
                        const sanitizedAvailability = { ...existingAvailability }; 

                        if(time_from !== undefined) sanitizedAvailability.time_from = String(time_from).trim();
                        if(time_to !== undefined) sanitizedAvailability.time_to = String(time_to).trim();
                        if(days !== undefined) {
                            sanitizedAvailability.days = Array.isArray(days)
                                ? days.map(d => String(d).trim().toLowerCase())
                                : [String(days).trim().toLowerCase()];
                        }

                        updateData[key] = sanitizedAvailability;
                    } else {
                        updateData[key] = value;
                    }
                }
            }
        }

        if(!Object.keys(updateData).length) {
            throw new ValidationError("No valid fields to update");
        } 

       

        const trainerUpdates = getChangedFields(existingTrainer, updateData);

        if(Object.keys(trainerUpdates).length) {
            trainerUpdates.updatedAt = new Date();
            trainerUpdates.updatedBy = new ObjectId(updater.id);
        }

        return await AuditLogsService.auditWrap({
            action: "TRAINER_UPDATED",
            entity: "trainers",
            entity_id: new ObjectId(id),
            actor: { id: new ObjectId(updater.id), role: updater.role, user_type: updater.user_type }, 
            meta: meta,
            summary: `${updater.first_name} ${updater.last_name} (${updater.role} → ${updater.user_type}) updated trainer profile`,
            changes: {
                patch: {
                    before: existingTrainer,
                    after:  trainerUpdates
                }
            },
            fn: async () => {
                return await TrainerManagementModel.updateTrainerProfile(
                    new ObjectId(id),
                    trainerUpdates
                );
            }
        });
        
    }

    async updateTrainerStatus(id, meta, status, updater) {
        if(!id || !ObjectId.isValid(id)) {
            throw new ValidationError("Invalid trainer ID");
        }
        
        const trainer = await TrainerManagementModel.findTrainerById(new ObjectId(id));
        if(!trainer) throw new ValidationError("No trainer found");

        if(!updater || !ObjectId.isValid(updater)) {
            throw new ValidationError("Invalid trainer ID");
        }

        if(!status) {
            throw new ValidationError("Missing status value");
        }

        const allowedStatus = ["active", "inactive", "archived"];

        if(!allowedStatus.includes(status)) {
            throw new ValidationError("Invalid status value");
        }

        let sanitized = {
            status: status.trim().toLowerCase(),
            updatedAt: new Date(),
            updatedBy: new ObjectId(updater)
        }

        if(status === "archived") {
            sanitized.archivedAt = new Date();
            sanitized.archivedBy = new ObjectId(updater)

            await AuditLogsService.auditWrap({
                action: "TRAINER_UPDATED",
                entity: "trainers",
                entity_id: new ObjectId(id),
                actor: { id: new ObjectId(updater.id), role: updater.role, user_type: updater.user_type }, 
                meta: meta,
                summary: `${updater.first_name} ${updater.last_name} (${updater.role} → ${updater.user_type}) removed the trainers assigned to members`,
                changes: {
                    patch: {
                        before: trainer.assigned_members,
                        after: "0"
                    }
                },
                fn: async () => {
                    await TrainerManagementModel.removeTrainerFromMembers(new ObjectId(id));
                }
            });
            
        }
        
        return await AuditLogsService.auditWrap({
            action: "TRAINER_UPDATED",
            entity: "trainers",
            entity_id: new ObjectId(id),
            actor: { id: new ObjectId(updater.id), role: updater.role, user_type: updater.user_type }, 
            meta: meta,
            summary: `${updater.first_name} ${updater.last_name} (${updater.role} → ${updater.user_type}) updated the trainer ${trainer.first_name} ${trainer.last_name} status to ${status}`,
                changes: {
                    patch: {
                        before: trainer.status,
                        after: status
                    }
                },
            fn: async () => {
                return await TrainerManagementModel.updateTrainerStatus(new ObjectId(id), sanitized);
            }
        });
        
    }

    async assignMember(id, meta, body, updater) {

        if(!body.member_id) {
            throw new ValidationError("Please select a member to add");
        }

        if(!id || !ObjectId.isValid(id)) {
            throw new ValidationError("Invalid trainer ID");
        }

        if(!updater.id || !ObjectId.isValid(updater.id)) {
            throw new ValidationError("Invalid updater ID");
        }

        if(!ObjectId.isValid(body.member_id)) {
            throw new ValidationError("Invalid member ID");
        }

        const trainer = await TrainerManagementModel.getTrainer(new ObjectId(id));

        if(!trainer) {
            throw new ValidationError("Trainer not found");
        }

        const member = await MemberModel.findUserById(new ObjectId(body.member_id));

        if(!member) {
            throw new ValidationError("Member not found");
        }

        if(member.trainer_id) {
            throw new ValidationError("Member has already have a trainer");
        }

        if(trainer.assigned_members.some(m => m.equals(new ObjectId(body.member_id)))) {
            throw new ValidationError("Member is already assigned to the trainer");
        }

        const email = {
            trainer_first_name: trainer.first_name,
            trainer_last_name: trainer.last_name,
            member_first_name: member.first_name,
            member_last_name: member.last_name,
            member_email: member.email,
            assignedAt: new Date(),
            assignedBy: new ObjectId(updater.id)
        };

        
        await AuditLogsService.auditWrap({
            action: "TRAINERS_UPDATED",
            entity: "trainers",
            entity_id: new ObjectId(id),
            actor: { id: new ObjectId(updater.id), role: updater.role, user_type: updater.user_type }, 
            meta: meta,
            summary: `${updater.first_name} ${updater.last_name} (${updater.role} → ${updater.user_type}) assigned member to ${member.first_name} ${member.last_name}`,
            fn: async () => {
                return await TrainerManagementModel.assignMember(
                    new ObjectId(body.member_id), 
                    new ObjectId(id), // trainer_id
                    new ObjectId(updater.id)
                );
            }
        });
        await AuditLogsService.auditWrap({
            action: "EMAIL_TRAINER_NEW_MEMBER",
            entity: "members",
            entity_id: new ObjectId(updater.id),
            actor: { id: new ObjectId(updater.id), role: updater.role, user_type: updater.user_type }, 
            meta: meta,
            summary: `${updater.first_name} ${updater.last_name} (${updater.role} → ${updater.user_type}) has been sent a notification email for new assigned member`,
            fn: async () => {
                return await sendEmail({
                    to: updater.email,
                    subject: "XFactor Fitness Gym Trece - Trainer Assignment",
                    html: memberAssignedToTrainerEmail(email)
                });
            }
        });
        return;
    }

    async removeMember(id, meta, body, updater) {
        if(!body.member_id) {
            throw new ValidationError("Please select a member to remove");
        }

        if(!id || !ObjectId.isValid(id)) {
            throw new ValidationError("Invalid trainer ID");
        }

        const trainer = await TrainerManagementModel.getTrainer(new ObjectId(id));

        if(!trainer) {
            throw new ValidationError("Trainer not found");
        }
        const memberId = new ObjectId(body.member_id);

        const newTrainerMembers = trainer.assignMember.filter(t => !t.equals(memberId));

        if(!updater || !ObjectId.isValid(updater)) {
            throw new ValidationError("Invalid updater ID");
        }

        if(!ObjectId.isValid(body.member)) {
            throw new ValidationError("Invalid member ID");
        }

        const sanitize = {
            assigned_members: newTrainerMembers,
            updatedAt: new Date(),
            updatedBy: new ObjectId(updater)
        }

        return await AuditLogsService.auditWrap({
            action: "TRAINER_UPDATED",
            entity: "trainers",
            actor: { id: new ObjectId(updater.id), role: updater.role, user_type: updater.user_type }, 
            meta: meta,
            summary: `${updater.first_name} ${updater.last_name} (${updater.role} → ${updater.user_type}) removed a member to trainer ${trainer.first_name} ${trainer.last_name}`,
            changes: {
                patch: {
                    before: trainer.assigned_members,
                    after: newTrainerMembers
                }
            },
            fn: async () => {
                return await TrainerManagementModel.removeMember(
                    new ObjectId(id),
                    new ObjectId(body.member),
                    sanitize
                );
            }
        });
        
    }
}

export default new TrainerService();