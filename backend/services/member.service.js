
import { ObjectId } from "mongodb";
import { ValidationError } from "../errors/ValidationError.js";
import AuditLogsService from "./audit.logs.service.js";
import { generateQrCode } from "../utils/generateQrCode.js";
import { hashedPassword } from "../utils/hashedPassword.js";
import MemberModel from "../models/MemberModel.js";
import TrainerManagementModel from "../models/TrainerManagementModel.js";
import MembershipModel from "../models/MembershipModel.js";
import { connectDB } from "../config/db.js";
import { trainerAssignedToMemberEmail } from "../templates/assignment/email.trainerAssignedToMember.js";
import { sendEmail } from "./email.service.js";
import checkDuplicate from "../utils/checkDuplicate.js";
import { getChangedFields } from "../utils/getChangedFields.js";

class MemberService {
    async PostForm(body, meta, updater) {
        const { gender, date_of_birth, height, weight, bmi, fitness_goal, medical_condition, training_type, experience_level, days_per_week, session_minutes } = body;
        const id = updater.id;

        if(!id || !ObjectId.isValid(id)) {
            throw new ValidationError("Invalid member ID");
        }

        const member = await MemberModel.findUserById(new ObjectId(id));
        if(!member) throw new ValidationError("Member not found");

        if(!gender || !date_of_birth || !height || !weight || !bmi || !fitness_goal || !training_type || !experience_level || !days_per_week || !session_minutes) {
            throw new ValidationError("Please fill out the necesarry fields")
        }

        const dob = new Date(date_of_birth);

        if(isNaN(dob.getTime())) {
            throw new ValidationError("Invalid date format for DOB");
        }

        const today = new Date();
        if(dob > today) {
            throw new ValidationError("DOB cannot be in the future");
        }

        const ageDiff = today.getFullYear() - dob.getFullYear();
        if(ageDiff < 12 || ageDiff > 100) {
            throw new ValidationError("Unrealistic Age");
        }

        if(!Array.isArray(fitness_goal)) {
            throw new ValidationError("Fitness goals must be an array" );
        }

        const qr = await generateQrCode(id);

        const sanitized = {
            gender: gender.trim().toLowerCase(),
            date_of_birth: dob,
            height: Number(height),
            weight: Number(weight),
            bmi: Number(bmi.toFixed(1)),
            fitness_goal: Array.isArray(fitness_goal)
                ? fitness_goal.map(f => f.trim().toLowerCase())
                : [fitness_goal.trim().toLowerCase()],
            medical_condition: medical_condition?.trim(),
            training_type: training_type.trim().toLowerCase(),
            experience_level: experience_level.trim().toLowerCase(),
            days_per_week: Number(days_per_week),
            session_minutes: Number(session_minutes),
            qr_code: qr,
            updatedAt: new Date(),
            updatedBy: new ObjectId(id)
        }
        
        return await AuditLogsService.auditWrap({
            action: "MEMBERS_POSTFORM",
            entity: "members",
            entity_id: new ObjectId(updater.id),
            actor: { id: new ObjectId(updater.id), role: updater.role, user_type: updater.user_type }, 
            meta: meta,
            changes: {
                patch: {
                    before: member,
                    after: sanitized
                }
            },
            summary: `${updater.first_name} ${updater.last_name} (${updater.role} → ${updater.user_type}) filled out postform for his health information`,
            fn: async () => {
                return await MemberModel.PostForm(id, sanitized);
            }
        });
    }

    async listOfTrainersAfterPostForm(member) {
        if(!member.id || !ObjectId.isValid(member.id)) {
            throw new ValidationError("Invalid member ID");
        }

        return MemberModel.listOfTrainersAfterPostForm(member.fitness_goal);
    }

    async selectTrainer(id, meta, updater) {
        if(!id || !ObjectId.isValid(id)) {
            throw new ValidationError("Invalid trainer ID");
        }

        const trainer = await TrainerManagementModel.findTrainerById(new ObjectId(id));
        if(!trainer) {
            throw new ValidationError("No trainer found");
        }

        const trainerSpecs = (trainer.specialization || []).map(s => String(s).toLowerCase());
        const memberGoal = Array.isArray(updater.fitness_goal)
        ? updater.fitness_goal.map(g => String(g).toLowerCase())
        : [];

        const hasMatch = memberGoal.some(goal => trainerSpecs.includes(goal));

        if(!hasMatch) {
            throw new ValidationError("Your fitness goals do not match trainer's specialization");
        }

        if(!updater || !ObjectId.isValid(updater.id)) {
            throw new ValidationError("Invalid member");
        }

        const email = {
            member_first_name: updater.first_name,
            member_last_name: updater.last_name,
            trainer_first_name: trainer.first_name,
            trainer_last_name: trainer.last_name,
            trainer_email: trainer.email,
            trainer_phone: trainer.phone,
            assignedAt: new Date(),
            assignedBy: updater.first_name
        };


        return await AuditLogsService.auditWrap({
            action: "MEMBERS_TRAINER_SELECT",
            entity: "members",
            entity_id: new ObjectId(updater.id) ?? null,
            actor: { id: new ObjectId(updater.id), role: updater.role }, 
            meta: meta,
            summary: `${updater.first_name} ${updater.last_name} selected ${trainer.first_name} ${trainer.last_name} as a trainer`,
            fn: async () => {
                const { db, client } = await connectDB();
                const session = client.startSession();

                try {
                    session.startTransaction();
                    
                    await MemberModel.assignATrainer(
                        new ObjectId(updater.id),
                        new ObjectId(id),
                        null,
                        session
                    );

                    await TrainerManagementModel.assignMember(
                        new ObjectId(updater.id),
                        new ObjectId(id),
                        null,
                        session
                    );

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
                                html: trainerAssignedToMemberEmail(email)
                            });
                        }
                    })
                    await session.commitTransaction();
                    
                } catch (error) {
                    await session.abortTransaction();
                    throw new ValidationError(error.message)
                } finally {
                    await session.endSession();
                }
                return;
            }
        });
    }






    /***
     * ADMIN FUNCTIONS BELOW
     */

    async createMember(body, meta, updater) {
        const { first_name, last_name, email, phone, gender, date_of_birth, password } = body;
        const id = updater.id;

        if (!first_name || !last_name || !email || !phone || !password || !gender || !date_of_birth) {
            throw new ValidationError("Please fill out the necessary fields" );
        }

        if (updater.role === "member" ||  updater.role === "" || updater.role === null || updater.role === undefined) {
            throw new ValidationError("Invalid authentication role");
        }

        if (!id || !ObjectId.isValid(id)) {
            throw new ValidationError("Invalid admin ID" );
        }

        const doesExist = await MemberModel.findUserByEmail(email.trim().toLowerCase());
        if (doesExist) {
            throw new ValidationError("Member already exists");
        }

        const hashpassword = await hashedPassword(password);

        const sanitized = {
            first_name: first_name.trim(),
            last_name: last_name.trim(),
            email: email.trim().toLowerCase(),
            phone: phone.trim(),
            address: null,
            password: hashpassword,

            role: "member",
            user_type: "member",
            status: "pending",

            member_type: "pending",
            gender: gender.trim().toLowerCase(),
            date_of_birth: date_of_birth ? new Date(date_of_birth) : null,
            height: null,
            weight: null,
            bmi: null,
            fitness_goal: null,
            training_type: null,
            medical_condition: null,
            experience_level: null,
            days_per_week: null,
            session_minutes: null,

            trainer_id: null,
            qr_code: null,

            emergency_name: null,
            emergency_contact: null,
            emergency_relationship: null,

            createdAt: new Date(),
            createdBy: new ObjectId(id),
            updatedAt: null,
            updatedBy: null,

            archivedAt: null,
            archivedBy: null,
        };

        await AuditLogsService.auditWrap({
            action: "MEMBERS_ADMIN_CREATE",
            entity: "members",
            actor: { id: new ObjectId(updater.id), role: updater.role, user_type: updater.user_type }, 
            meta: meta,
            summary: `${updater.first_name} ${updater.last_name} (${updater.role} → ${updater.user_type}) created  ${first_name.trim()} ${last_name.trim()}`,
            fn: async () => {
                return await MemberModel.createMember(sanitized);
            },
        });

    } 


    async listMembers(query) {
        let { status, fitness_goal, gender, plan_id, search, page = 1, limit = 10 } = query;

        page = Number(page);
        limit = Number(limit)

        let filter = {};

        if(status) {
            filter.status = status.trim().toLowerCase();
        }

        if(fitness_goal) {

            const goals = Array.isArray(fitness_goal)
                ? fitness_goal
                : [fitness_goal];

            filter.fitness_goal = {
                $in: goals.map(g => g.trim().toLowerCase())
            }
        }

        if(plan_id && ObjectId.isValid(plan_id)) {
            filter.plan_id = new ObjectId(plan_id);
        }
        
        if(gender) {
            filter.gender = gender.trim().toLowerCase()
        }

        search = search?.trim();

        filter.role = "member";

        return await MemberModel.listMembers(filter, search, page, limit);
    } 


    async viewMember(id) {
        if(!id || !ObjectId.isValid(id)) {
            throw new ValidationError("Invalid member ID");
        }

        return await MemberModel.viewMember(new ObjectId(id));
    }


    async updateMemberProfile(id, body, meta, updater) {
        let { first_name, last_name, gender, date_of_birth, phone, email, address, trainer_id, emergency_name, emergency_contact, emergency_relationship, plan_id, pricing_id, start_date, expiry_date, membership_status, experience_level, days_per_week, session_minutes, height, weight, bmi, fitness_goal, training_type } = body;
        let updatedBy = updater.id;

        const sanitizedMember = {};
        const sanitizedMembership = {};

        // Member Collection
        if(!id || !ObjectId.isValid(id)) throw new ValidationError("Invalid member ID");
        if(first_name) sanitizedMember.first_name = first_name.trim();
        if(last_name) sanitizedMember.last_name = last_name.trim();
        if(gender) sanitizedMember.gender = gender.trim().toLowerCase();
        if(date_of_birth) {
            const dob = new Date(date_of_birth);

            if(Number.isNaN(dob.getTime())) {
                throw new ValidationError("Invalid date of birth format");
            }
            sanitizedMember.date_of_birth = dob
        }
        if(experience_level) sanitizedMember.experience_level = experience_level.trim().toLowerCase();
        if(days_per_week) sanitizedMember.days_per_week = Number(days_per_week)
        if(session_minutes) sanitizedMember.session_minutes = Number(session_minutes)
        if(height) sanitizedMember.height = Number(height)
        if(weight) sanitizedMember.weight = Number(weight)
        if(bmi) sanitizedMember.bmi = Number(bmi)
        if(fitness_goal) sanitizedMember.fitness_goal = Array.isArray(fitness_goal) ? Array.map(f => f.trim().toLowerCase()) : [fitness_goal.trim().toLowerCase()];
        if(training_type) sanitizedMember.training_type = training_type.trim().toLowerCase();    
        if(phone) sanitizedMember.phone = phone.trim();
        if(email) sanitizedMember.email = email.trim().toLowerCase();
        if(address) sanitizedMember.address = address.trim().toLowerCase();
        if(trainer_id && ObjectId.isValid(trainer_id)) sanitizedMember.trainer_id = new ObjectId(trainer_id);
        if(emergency_name) sanitizedMember.emergency_name = emergency_name.trim();
        if(emergency_contact) sanitizedMember.emergency_contact = emergency_contact;
        if(emergency_relationship) sanitizedMember.emergency_relationship = emergency_relationship.trim().toLowerCase();
        if(!updatedBy || !ObjectId.isValid(updatedBy)) throw new ValidationError("Invalid admin ID");

        await checkDuplicate(new ObjectId(id), {
            email: sanitizedMember.email,
            phone: sanitizedMember.phone
        }); 
        
        const existingMember = await MemberModel.findUserById(new ObjectId(id));
        if (!existingMember) throw new ValidationError("No member found");


        const memberUpdates = getChangedFields(existingMember, sanitizedMember);

        return await AuditLogsService.auditWrap({
            action: "MEMBERS_ADMIN_UPDATE",
            entity: "members",
            entity_id: new ObjectId(id) ?? null,
            actor: { id: new ObjectId(updater.id), role: updater.role, user_type: updater.user_type }, 
            meta: meta,
            summary: `${updater.first_name} ${updater.last_name} (${updater.role} → ${updater.user_type}) updated ${first_name} ${last_name} profile and/or membership`,
            changes: { patch:  {
                before: existingMember,
                after: memberUpdates,
            } },
            fn: async () => {
                const { client } = await connectDB();
                const session = client.startSession();

                try {
                    session.startTransaction();

                    if(Object.keys(memberUpdates).length) {
                        memberUpdates.updatedAt = new Date();
                        memberUpdates.updatedBy = new ObjectId(updatedBy);

                        await MemberModel.updateMember(new ObjectId(id), memberUpdates, session);

                    }

                    await session.commitTransaction();
                } catch (error) {
                    await session.abortTransaction();
                    throw new ValidationError(error.message)
                } finally {
                    await session.endSession();
                }

                return;
            }
        });
    } 

    async updateUserStatus(id, status, meta, updater) {
        let adminId = updater.id;
        
        const allowedStatus = ["active", "inactive", "archived"];

        if(!id || !ObjectId.isValid(id)) {
            throw new ValidationError("Invalid member ID");
        }
        
        const member = await MemberModel.findUserById(new ObjectId(id));
        if(!member) throw new ValidationError("No member found");

        if(!adminId || !ObjectId.isValid(adminId)) {
            throw new ValidationError("Invalid member ID");
        }

        id = new ObjectId(id);
        adminId = new ObjectId(adminId);

        if(!status) {
            throw new ValidationError("Missing status");
        }

        if(!allowedStatus.includes(status)) {
            throw new ValidationError("Invalid status");
        }

        const updateMemberData = {
            status: status.trim().toLowerCase(),
            updatedAt: new Date(),
            updatedBy: adminId,
            archivedAt: null,
            archivedBy: null
        };

        const updateMembershipData = {
            updatedAt: new Date(),
            updatedBy: adminId,
            archivedAt: null,
            archivedBy: null
        };

        if(status === "active") {
            updateMemberData.archivedAt = null;
            updateMemberData.archivedBy = null;

            updateMembershipData.archivedAt = null;
            updateMembershipData.archivedBy = null;
            updateMembershipData.status = "active";
        }
        if(status === "inactive") updateMembershipData.status = "cancelled"
        if(status === "archived") {
            updateMemberData.archivedAt = new Date();
            updateMemberData.archivedBy = adminId;

            updateMembershipData.status = "archived" 
            updateMembershipData.archivedAt = new Date();
            updateMembershipData.archivedBy = adminId;
        }

        return await AuditLogsService.auditWrap({
            action: "MEMBERS_STATUS_UPDATE",
            entity: "members",
            entity_id: new ObjectId(id) ?? null,
            actor: { id: new ObjectId(updater.id), role: updater.role, user_type: updater.user_type }, 
            meta: meta,
            changes: {
                patch: {
                    before: member.status,
                    after: status
                }
            },
            summary: `${updater.first_name} ${updater.last_name} (${updater.role} → ${updater.user_type}) updated ${member.first_name} ${member.last_name} profile status and/or membership status to ${status}`,
            fn: async () => {
                const { client } = await connectDB();
                const session = client.startSession();

                try {
                    session.startTransaction();
                    await MemberModel.updateUserStatus(id, updateMemberData, session);
                    await MembershipModel.updateMembershipStatus(id, updateMembershipData, session);
                    await session.commitTransaction();
                } catch (error) {
                    await session.abortTransaction();
                    throw new ValidationError(error.message)
                } finally {
                    await session.endSession();
                }
                
                return;
            }
        });
        
    } 

    async assignATrainer(id, body, meta, updater) {
        let { trainer_id } = body;
        let adminId = updater.id;

        if(!id || !ObjectId.isValid(id)) {
            throw new ValidationError("Invalid member ID");
        }
        const member = await MemberModel.findUserById(new ObjectId(id));
        if(!member) throw new ValidationError("No member found");

        if(!trainer_id || !ObjectId.isValid(trainer_id)) {
            throw new ValidationError("Invalid trainer ID");
        }
        const trainerExist = await TrainerManagementModel.getTrainer(new ObjectId(id));
        if(!trainerExist) {
            throw new ValidationError("No trainer exist");
        }

        const assignedMembers = trainerExist.assigned_members || [];

        if(assignedMembers.length >= trainerExist.max_members) {
            throw new ValidationError("Trainer is already full");
        }

        if(assignedMembers.some(id => id.equals(id))) {
            throw new ValidationError("Member already assigned to this trainer");
        }


        if(!adminId || !ObjectId.isValid(adminId)) {
            throw new ValidationError("Invalid admin ID");
        }

        id = new ObjectId(id);
        trainer_id = new ObjectId(trainer_id);
        adminId = new ObjectId(adminId);

        
        return await AuditLogsService.auditWrap({
            action: "MEMBERS_ASSIGN_TRAINER",
            entity: "members",
            entity_id: new ObjectId(id) ?? null,
            actor: { id: new ObjectId(updater.id), role: updater.role, user_type: updater.user_type }, 
            meta: meta,
            summary: `${updater.first_name} ${updater.last_name} (${updater.role} → ${updater.user_type}) assigned a trainer ${trainerExist.first_name} ${trainerExist.last_name} to ${member.first_name} ${member.last_name}`,
            fn: async () => {
                const { db, client } = await connectDB();
                const session = client.startSession();

                try {
                    session.startTransaction();
                    await MemberModel.assignATrainer(id, trainer_id, adminId, session);
                    await TrainerManagementModel.assignMember(id, trainer_id, adminId, session);

                    await session.commitTransaction();
                } catch (error) {
                    await session.abortTransaction();
                    throw new ValidationError(error)
                } finally {
                    await session.endSession()
                }
                
                return;

            }
        });
        
    }
}

export default new MemberService();