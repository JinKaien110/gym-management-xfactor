import { ObjectId } from "mongodb";
import dotenv from "dotenv";
import TrainerManagementModel from "../models/TrainerManagementModel.js";
import { hashedPassword } from "../utils/hashedPassword.js";
import checkDuplicate from "../utils/checkDuplicate.js";
import { getChangedFields } from "../utils/getChangedFields.js";
import MemberModel from "../models/MemberModel.js";


class TrainerService {
    async createTrainer(body, user) {
        let { first_name, last_name, email, phone, password, specialization, certification, availability, assigned_members, max_members } = body;
        let creator = user.id;

        if(!first_name || !last_name || !email || !phone || !password || !specialization || !availability || !max_members  ) {
            throw new Error("Please fill out the necessary fields");
        }

        if(isNaN(max_members)) {
            throw new Error("Max members should be numerical");
        }

        if(!creator || !ObjectId.isValid(creator)) {
            throw new Error("Invalid admin ID");
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

        return await TrainerManagementModel.createTrainer(sanitized);
    }

    async listTrainers(query) {
        let { status, specialization, search, page = 1, limit = 10} = query;

        const allowedStatus = ["active", "inactive", "archived"];

        if(status && !allowedStatus.includes(status)) {
            throw new Error("Invalid status");
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
            throw new Error("Invalid trainer ID");
        }

        return await TrainerManagementModel.getTrainer(new ObjectId(id));
    }

    async updateTrainerProfile(id, body, updater) {
        if(!id || !ObjectId.isValid(id)) {
            throw new Error("Invalid trainer ID");
        }

        if(!updater.id || !ObjectId.isValid(updater.id)) {
            throw new Error("Invalid updater ID");
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
            throw new Error("Unauthorized role");
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
                        throw new Error(`${key} must be a number`)
                    }
                    updateData[key] = num;
                } else if (fieldTypes[key] === "array") {
                    if(!Array.isArray(value)) {
                        throw new Error(`${key} must be an array`);
                    }
                    updateData[key] = value.map(v => typeof v === "string" ? v.trim().toLowerCase() : v);
                } else if (fieldTypes[key] === "object") {
                    if(typeof value !== "object") {
                        throw new Error(`${key} must be an object`);
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
            throw new Error("No valid fields to update");
        } 

       

        const trainerUpdates = getChangedFields(existingTrainer, updateData);

        if(Object.keys(trainerUpdates).length) {
            updateData.updatedAt = new Date();
            updateData.updatedBy = new ObjectId(updater.id);
        }

        return await TrainerManagementModel.updateTrainerProfile(
            new ObjectId(id),
            updateData
        )
    }

    async updateTrainerStatus(id, status, updater) {
        if(!id || !ObjectId.isValid(id)) {
            throw new Error("Invalid trainer ID");
        }

        if(!updater || !ObjectId.isValid(updater)) {
            throw new Error("Invalid trainer ID");
        }

        if(!status) {
            throw new Error("Missing status value");
        }

        const allowedStatus = ["active", "inactive", "archived"];

        if(!allowedStatus.includes(status)) {
            throw new Error("Invalid status value");
        }

        let sanitized = {
            status: status.trim().toLowerCase(),
            updatedAt: new Date(),
            updatedBy: new ObjectId(updater)
        }

        if(status === "archived") {
            sanitized.archivedAt = new Date();
            sanitized.archivedBy = new ObjectId(updater)

            await TrainerManagementModel.removeTrainerFromMembers(new ObjectId(id));
        }
        
        return await TrainerManagementModel.updateTrainerStatus(new ObjectId(id), sanitized);
    }

    async assignMember(id, body, updater) {

        if(!body.member) {
            throw new Error("Please select a member to add");
        }

        if(!id || !ObjectId.isValid(id)) {
            throw new Error("Invalid trainer ID");
        }

        if(!updater || !ObjectId.isValid(updater)) {
            throw new Error("Invalid updater ID");
        }

        if(!ObjectId.isValid(body.member)) {
            throw new Error("Invalid member ID");
        }

        const trainer = await TrainerManagementModel.getTrainer(new ObjectId(id));

        if(!trainer) {
            throw new Error("Trainer not found");
        }

        const member = await MemberModel.FindUserById(body.member);

        if(!member) {
            throw new Error("Member not found");
        }

        if(member.trainer_id) {
            throw new Error("Member has already have a trainer");
        }

        if(trainer.assigned_members.some(m => m.equals(new ObjectId(body.member)))) {
            throw new Error("Member is already assigned to the trainer");
        }

        const sanitize = {
            updatedAt: new Date(),
            updatedBy: new ObjectId(updater)
        }

        return await TrainerManagementModel.assignMember(
            new ObjectId(id),
            new ObjectId(body.member),
            sanitize
        )
    }

    async removeMember(id, body, updater) {
        if(!body.member) {
            throw new Error("Please select a member to remove");
        }

        if(!id || !ObjectId.isValid(id)) {
            throw new Error("Invalid trainer ID");
        }

        if(!updater || !ObjectId.isValid(updater)) {
            throw new Error("Invalid updater ID");
        }

        if(!ObjectId.isValid(body.member)) {
            throw new Error("Invalid member ID");
        }

        const sanitize = {
            updatedAt: new Date(),
            updatedBy: new ObjectId(updater)
        }

        return await TrainerManagementModel.removeMember(
            new ObjectId(id),
            new ObjectId(body.member),
            sanitize
        )
    }
}

export default new TrainerService();