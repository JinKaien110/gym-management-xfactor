import { ObjectId } from "mongodb";
import dotenv from "dotenv";
import MembershipModel from "../models/MembershipModel.js";
import { getChangedFields } from "../utils/getChangedFields.js";
import PricingModel from "../models/PricingModel.js";
import MembershipRequestModel from "../models/MembershipRequestModel.js";
import { calculateEndDate } from "../utils/calculateEndDate.js";

dotenv.config();

class MembershipService {
    async createMembershipRequest(user, body) {
        let { member_id, plan_id, pricing_id} = body;
        let creator = user.id;

        if(!member_id || !ObjectId.isValid(member_id)) {
            throw new Error("Invalid member ID");
        }

        if(!plan_id || !ObjectId.isValid(plan_id)) {
            throw new Error("Invalid plan ID");
        }

        if(!creator || !ObjectId.isValid(creator)) {
            throw new Error("Invalid admin ID");
        }

        if(!pricing_id || !ObjectId.isValid(pricing_id)) {
            throw new Error("Invalid pricing ID");
        }

        const pricing = await PricingModel.getPricing(new ObjectId(pricing_id));

        if(!pricing) {
            throw new Error("Pricing not found");
        }

        const sanitized = {
            member_id: new ObjectId(member_id),
            plan_id: new ObjectId(plan_id),
            pricing_id: new ObjectId(pricing_id),
            status: "pending",
            createdAt: new Date(),
            createdBy: new ObjectId(creator),
            updatedAt: new Date(),
            updatedBy: new ObjectId(creator)
        }
        
        return await MembershipRequestModel.createMembershipRequest(sanitized);
    }

    async createMembership(id) {
        const request = await MembershipRequestModel.findMembershipByRequestId(new ObjectId(id));

        if(!request) {
            throw new Error("Unable to find membership request");
        }

        const exist = await MembershipModel.alreadyHaveMembership(new ObjectId(request._id));

        if(exist) {
            return exist;
        }

        const endDate = await calculateEndDate(request.pricing_id);

        await MembershipModel.createMembership({
            member_id: request.member_id,
            plan_id: request.plan_id,
            pricing_id: request.pricing_id,
            start_date: new Date(),
            end_date: endDate,
            status: "active",
            is_frozen: false,
            frozenAt: null,
            frozenBy: null,
            unfrozenAt: null,
            createdAt: new Date(),
            createdBy: request.createdBy,
            updatedAt: new Date(),
            updatedBy: request.updatedBy,
            archivedAt: null,
            archivedBy: null
        });

    }

    async viewMembership(id) {
        if(!id || !ObjectId.isValid(id)) {
            throw new Error("Invalid membership ID");
        }

        return await MembershipModel.viewMembership(new ObjectId(id));
    }

    async updateMembership(id, body, updater) {
        if(!id || !ObjectId.isValid(id)) {
            throw new Error("Invalid membership ID");
        }

        if(body.member_id && !ObjectId.isValid(body.member_id)) {
            throw new Error("Invalid member ID");
        }

        if(body.plan_id && !ObjectId.isValid(body.plan_id)) {
            throw new Error("Invalid plan ID");
        }

        if(body.pricing_id && !ObjectId.isValid(body.pricing_id)) {
            throw new Error("Invalid pricing ID");
        }

        if(!updater.id || !ObjectId.isValid(updater.id)) {
            throw new Error("Invalid updater ID");
        }

        if(body.start_date && Number.isNaN(body.start_date.getTime())) {
            throw new Error("Invalid start date format")
        }

        if(body.end_date && Number.isNaN(body.end_date.getTime())) {
            throw new Error("Invalid end date format")
        }

        const exisitngMembership = await MembershipModel.viewMembership(new ObjectId(id));

        if(!exisitngMembership) {
            throw new Error("Membership not found");
        }

        const updateData = {};
        let allowedFields;

        if(updater.role === "staff") {
            allowedFields = [
                "member_id"
            ];
        }

        if(updater.role === "admin" ) {
            allowedFields = [
                "member_id",
                "plan_id",
                "pricing_id",
                "start_date",
                "end_date"
            ];
        }

        if(!allowedFields.length) {
            throw new Error("Unauthorized Role");
        }
            
        for (const key of allowedFields) {
            const value = body[key];
            if (value !== undefined) {
                if (value[key] === "plan_id" || value[key] === "pricing_id" || value[key] === "member_id") {
                    updateData[key] = new ObjectId(value[key]);
                } else if (value[key] === "start_date" || value[key] === "end_date") {
                    updateData[key] = new Date(value[key]);
                }
            }
        }


        const updates = getChangedFields(exisitngMembership, updateData);

        if(Object.keys(updates).length) {
            updates.updatedAt = new Date()
            updates.updatedBy = new ObjectId(updater.id)
        }

        return await MembershipModel.updateMembership(
            new ObjectId(id),
            updates
        );
    }

    async updateMembershipStatus(id, body, updater) {
        if(!id || !ObjectId.isValid(id)) {
            throw new Error("Invalid membership ID");
        }

        const membership = await MembershipModel.viewMembership(new ObjectId(id));

        if(!membership) {
            throw new Error("Membership not found");
        }

        if(!body.member_id || !ObjectId.isValid(body.member_id)) {
            throw new Error("Invalid member ID");
        }

        let status = body.status.trim().toLowerCase();
        let member_id = new ObjectId(body.member_id);

        if(status) {
            throw new Error("Missing status value");
        }

        const allowedStatus = ["active", "cancelled", "archived"];

        if(!allowedStatus.includes(status)) {
            throw new Error("Invalid status value");
        }

        if(!updater.id || !ObjectId.isValid(updater.id)) {
            throw new Error("Invalid updater ID");
        }

        let updates = {
            status: status,
            updatedAt: new Date(),
            updatedBy: new ObjectId(updater.id)
        };
        
        if(status === "cancelled" && body.payment_method === "cash") {
            const cancellationRequest = {
                membership_id: new ObjectId(id),
                member_id: member_id,
                status: "completed",
                amount: 5000,
                createdAt: new Date(),
                createdBy: new ObjectId(updater.id)
            }
                
            // await CancellationRequestModel.create(
            //    cancellationRequest
            // );
        }

        if(status === "cancelled" && body.payment_method === "gcash") {
            
        }

        if(status === "archived") {
            updates.archivedAt = new Date();
            updates.archivedBy = new ObjectId(updater.id);
        }


        return await MembershipModel.updateMembershipStatus(
            new ObjectId(id),
            updates
        );
    }

    async freezeMembership(id, updater) {
        if(!id || !ObjectId.isValid(id)) {
            throw new Error("Invalid membership ID");
        }

        const membership = await MembershipModel.viewMembership(new ObjectId(id));

        if(!membership) {
            throw new Error("Membership not found");
        }

        if(membership.status !== "active") {
            throw new Error("Only active membership can be freeze");
        }

        if(membership.is_frozen) {
            throw new Error("Membership is already frozen");
        }

        if(!updater.id || !ObjectId.isValid(updater.id)) {
            throw new Error("Invalid updater ID");
        }

        const data = {
            is_frozen: true,
            frozenAt: new Date(),
            frozenBy: new ObjectId(updater.id),
            updatedAt: new Date(),
            updatedBy: new ObjectId(updater.id)
        }

        return await MembershipModel.freezeMembership(
            new ObjectId(id),
            data
        );
    }

    async unfreezeMembership(id, updater) {
        if(!id || !ObjectId.isValid(id)) {
            throw new Error("Invalid membership ID");
        }

        const membership = await MembershipModel.viewMembership(new ObjectId(id));

        if(!membership) {
            throw new Error("Membership not found");
        }

        if(!membership.is_frozen) {
            throw new Error("Membership is not frozen");
        }

        if(!updater.id || !ObjectId.isValid(updater.id)) {
            throw new Error("Invalid updater ID");
        }

        const data = {
            is_frozen: false,
            frozenAt: null,
            frozenBy: null,
            unfrozenAt: new Date(),
            updatedAt: new Date(),
            updatedBy: new ObjectId(updater.id)
        }

        return await MembershipModel.unfreezeMembership(
            new ObjectId(id),
            data
        );
    }
}

export default new MembershipService();
