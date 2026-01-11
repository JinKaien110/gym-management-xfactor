import { ObjectId } from "mongodb";
import dotenv from "dotenv";
import { debuggerLog } from "../utils/debuggerLog.js";
import MemberManagementModel from "../models/MemberManagementModel.js";
import { hashedPassword } from "../utils/hashedPassword.js";
import { getChangedFields } from "../utils/getChangedFields.js";
import checkDuplicate from "../utils/checkDuplicate.js";
dotenv.config();

class MemberManagementController {
    async createMember(req, res) {
        try {
            const { first_name, last_name, email, phone, password, role } = req.body;
            const createdBy = req.user.id;

            if(!first_name || !last_name || !email || !phone || !password ) {
                return res.status(400).json({ message: "Please fill out the necessary fields"});
            }

            if(req.user.role !== "admin") {
                return res.status(403).json({ message: "Invalid authentication role"});
            }

            const doesExist = await MemberManagementModel.findUserByEmail(email.trim().toLowerCase());

            if(doesExist) {
                return res.status(400).json({ message: "User already exist"});
            }

            if(!createdBy || !ObjectId.isValid(createdBy)) {
                return res.status(400).json({ message: "Invalid admin ID"});
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
                status: "active",
                member_type: null,
                gender: null,
                date_of_birth: null,
                height: null,
                weight: null,
                bmi: null,
                fitness_goal: null,
                medical_condition: null,
                trainer_id: null,
                qr_code: null,
                emergency_name: null,
                emergency_contact: null,
                emergency_relationship: null,
                createdAt: new Date(),
                createdBy: new ObjectId(createdBy),
                updatedAt: new Date(),
                updatedBy: new ObjectId(createdBy),
                archivedAt: null,
                archivedBy: null
            }

            const member = await MemberManagementModel.createMember(sanitized)

            return res.status(201).json({ message: "Successfully created the user", userId: member.insertedId});

        } catch (error) {
            debuggerLog("createMember Model: ", error);
            return res.status(500).json({ message: "Server Error", error});
        }
    }

    async listMembers(req, res) {
        try {
            let { status, fitness_goal, gender, plan_id, search, page = 1, limit = 10 } = req.query;

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

            const members = await MemberManagementModel.listMembers(filter, search, page, limit);

            return res.status(200).json(members);

        } catch (error) {
            debuggerLog("listMembers Model: ", error);
            return res.status(500).json({ message: "Server Error", error});
        }
    }

    async viewMember(req, res) {
        try {
            let { id } = req.params;

            if(!id || !ObjectId.isValid(id)) {
                return res.status(400).json({ message: "Invalid member ID"});
            }

            id = new ObjectId(id);

            const member = await MemberManagementModel.viewMember(id);

            return res.status(200).json(member);

        } catch (error) {
            debuggerLog("viewMember Model: ", error);
            return res.status(500).json({ message: "Server Error", error});
        }
    }

    async updateMemberProfile(req, res) {
        try {
            let { id } = req.params;
            let { first_name, last_name, gender, date_of_birth, phone, email, address, trainer_id, emergency_name, emergency_contact, emergency_relationship, plan_id, pricing_id, start_date, expiry_date, membership_status } = req.body;
            let updatedBy = req.user.id;

            const sanitizedMember = {};
            const sanitizedMembership = {};

            // Member Collection
            if(!id || !ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid member ID"});
            if(first_name) sanitizedMember.first_name = first_name.trim();
            if(last_name) sanitizedMember.last_name = last_name.trim();
            if(gender) sanitizedMember.gender = gender.trim().toLowerCase();
            if(date_of_birth) {
                dob = new Date(date_of_birth);

                if(Number.isNaN(dob.getTime())) {
                    return res.status(400).json({ message: "Invalid date of birth format"});
                }
                sanitizedMember.date_of_birth = dob
            }
            if(phone) sanitizedMember.phone = phone.trim();
            if(email) sanitizedMember.email = email.trim().toLowerCase();
            if(address) sanitizedMember.address = address.trim().toLowerCase();
            if(trainer_id && ObjectId.isValid(trainer_id)) sanitizedMember.trainer_id = new ObjectId(trainer_id);
            if(emergency_name) sanitizedMember.emergency_name = emergency_name.trim();
            if(emergency_contact) sanitizedMember.emergency_contact = emergency_contact;
            if(emergency_relationship) sanitizedMember.emergency_relationship = emergency_relationship.trim().toLowerCase();
            if(!updatedBy || !ObjectId.isValid(updatedBy)) return res.status(400).json({ message: "Invalid admin ID"});

            // Membership Collection
            if(plan_id && ObjectId.isValid(plan_id)) sanitizedMembership.plan_id = new ObjectId(plan_id);
            if(pricing_id && ObjectId.isValid(pricing_id)) sanitizedMembership.pricing_id = new ObjectId(pricing_id);
            if(start_date) sanitizedMembership.start_date = new Date(start_date);
            if(expiry_date) sanitizedMembership.expiry_date = new Date(expiry_date);
            if(membership_status) sanitizedMembership.status = membership_status.trim().toLowerCase();

            await checkDuplicate(id, {
                email: sanitizedMember.email,
                phone: sanitizedMember.phone
            }); 
           
            const existingMember = await MemberManagementModel.findUserById(id);
            
            const existingMembership = await MemberManagementModel.findUserByMembership(id);

            const memberUpdates = getChangedFields(existingMember, sanitizedMember);

            if(Object.keys(memberUpdates).length) {
                memberUpdates.updatedAt = new Date();
                memberUpdates.updatedBy = new ObjectId(updatedBy);

                await MemberManagementModel.updateMember(id, memberUpdates);

            }

            const membershipUpdates = getChangedFields(existingMembership, sanitizedMembership);

            if(Object.keys(membershipUpdates).length) {
                membershipUpdates.updatedAt = new Date();
                membershipUpdates.updatedBy = new ObjectId(updatedBy)

                await MemberManagementModel.updateMembership(id, membershipUpdates);

                return;
            }
            
            return res.status(202).json({ message: "Successfully updated the member details"});
 
        } catch (error) {
            if(error.code === 11000) {
                return res.status(400).json({ message: "Email or phone already used by other member"});
            }

            debuggerLog("updateMemberProfile Model: ", error);
            return res.status(500).json({ message: "Server Error", error: error.message});
        }
    }

    async updateUserStatus(req, res) {
        try {
            let { id } = req.params;
            const { status } = req.body;
            let adminId = req.user.id;
            
            const allowedStatus = ["active", "inactive", "archived"];

            if(!id || !ObjectId.isValid(id)) {
                return res.status(400).json({ message: "Invalid member ID"});
            }

            if(!adminId || !ObjectId.isValid(adminId)) {
                return res.status(400).json({ message: "Invalid member ID"});
            }

            id = new ObjectId(id);
            adminId = new ObjectId(adminId);

            if(!status) {
                return res.status(400).json({ message: "Missing status"});
            }

            if(!allowedStatus.includes(status)) {
                return res.status(400).json({ message: "Invalid status"});
            }

            const updateMemberData = {
                status: status.trim().toLowerCase(),
                updatedAt: new Date(),
                updatedBy: adminId,
                archivedAt: null,
                archivedBy: null
            };

            const updateMembershipData = {
                status: null,
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

            await MemberManagementModel.updateUserStatus(id, updateMemberData, updateMembershipData);

            return res.status(200).json({ message: "Successfully updated member and membership status"});
                

        } catch (error) {
            debuggerLog("updateUserStatus Model: ", error);
            return res.status(500).json({ message: "Server Error", error: error.message});
        }
    }

    async assignATrainer(req, res) {
        try {
            let { id } = req.params;
            let { trainer_id } = req.body;
            let adminId = req.user.id;

            if(!id || !ObjectId.isValid(id)) {
                return res.status(400).json({ message: "Invalid member ID"});
            }

            if(!trainer_id || !ObjectId.isValid(trainer_id)) {
                return res.status(400).json({ message: "Invalid trainer ID"});
            }

            if(!adminId || !ObjectId.isValid(adminId)) {
                return res.status(400).json({ message: "Invalid admin ID"});
            }

            id = new ObjectId(id);
            trainer_id = new ObjectId(trainer_id);
            adminId = new ObjectId(adminId);

            const result = await MemberManagementModel.assignATrainer(id, trainer_id, adminId);

            return res.status(200).json({ message: `Successfully assigned a trainer: ${result}` });
            
        } catch (error) {
            debuggerLog("assignATrainer Model: ", error);
            return res.status(500).json({ message: "Server Error" + error.message});
        }
    }
}

export default new MemberManagementController();