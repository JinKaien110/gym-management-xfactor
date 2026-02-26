import { ObjectId } from "mongodb";
import dotenv from "dotenv";
import MembershipModel from "../models/MembershipModel.js";
import { getChangedFields } from "../utils/getChangedFields.js";
import PricingModel from "../models/PricingModel.js";
import MembershipRequestModel from "../models/MembershipRequestModel.js";
import { calculateEndDate } from "../utils/calculateEndDate.js";
import PaymentModel from "../models/PaymentModel.js";
import PaymentService from "./payment.service.js";
import { ValidationError } from "../errors/ValidationError.js";
import PlanModel from "../models/PlanModel.js";
import MemberModel from "../models/MemberModel.js";
import AuditLogsService from "./audit.logs.service.js";
import { emailRequestMembership } from "../templates/membership/email.createRequestMembership.js";
import { sendEmail } from "./email.service.js";
import { emailMembershipActivated } from "../templates/membership/email.createMembership.js";
import ucfirst from "../utils/ucfirst.js";
import { membershipFrozenEmail } from "../templates/membership/email.freezeMembership.js";
import { membershipUpdatedEmail } from "../templates/membership/email.updateMembership.js";

dotenv.config();

class MembershipService {
    async requestMembership(meta, body, updater, session = null) {
        let { plan_id, pricing_id, member_type, status } = body;
        const id = new ObjectId(updater.id);

        if(!updater) {
            throw new ValidationError("No member login");
        }

        if(!id || !ObjectId.isValid(id)) {
            throw new ValidationError("Invalid member ID");
        }

        const member = await MemberModel.findUserById(new ObjectId(id));
        if(!member) throw new ValidationError("No member found");

         if(!plan_id || !ObjectId.isValid(plan_id)) {
            throw new ValidationError("Invalid plan ID");
        }

        if(!pricing_id || !ObjectId.isValid(pricing_id)) {
            throw new ValidationError("Invalid pricing ID");
        }
        
        if(!member_type) {
            throw new ValidationError("Member type is required");
        }

        if(member_type === "regular") {
            status = "ready_for_payment"
        }

        if(member_type === "discounted") {
            status = "pending_discount_review"
        }

        const plan = await PlanModel.viewAPlan(new ObjectId(plan_id));
        if(!plan) throw new ValidationError("Plan not found");

        const pricing = await PricingModel.getPricing(new ObjectId(pricing_id));
        if(!pricing) {
            throw new ValidationError("Pricing not found");
        }

        const sanitized = {
            member_id: id,
            plan_id: new ObjectId(plan_id),
            pricing_id: new ObjectId(pricing_id),
            status: status?.trim().toLowerCase() ?? "draft", // draft | paid | pending_discount_review | ready_for_payment
            member_type: member_type.trim().toLowerCase() ?? "regular",
            request_type: "creation",
            createdAt: new Date(),
            createdBy: id,
            updatedAt: null,
            updatedBy: null
        }

        const membership = {
            label: plan.label,
            duration: pricing.label,
            duration_days: pricing.duration_days,
            price: pricing.price,
            membership_fee: pricing.membership_fee,
            member_type: member_type,
        }

        return await AuditLogsService.auditWrap({
            action: "MEMBERSHIP_REQUEST_CREATED",
            entity: "memberships_request",
            actor: { id: id, role: updater.role, user_type: updater.user_type }, 
            meta: meta,
            summary: `${updater.first_name} ${updater.last_name} (${updater.role} → ${updater.user_type}) requested for an membership ${plan.label} for price of ${pricing.price}`,
            fn: async () => {
                await AuditLogsService.auditWrap({
                    action: "EMAIL_MEMBERSHIP_REQUEST",
                    entity: "memberships_request",
                    actor: { id: new ObjectId(updater.id), role: updater.role, user_type: updater.user_type }, 
                    meta: meta,
                    summary: `${updater.first_name} ${updater.last_name} (${updater.role} → ${updater.user_type}) has been sent a membership request notification`,
                    fn: async () => {
                        await sendEmail({
                            to: member.email,
                            subject: "XFactor Fitness Gym Trece - MEMBERSHIP REQUEST",
                            html: emailRequestMembership(member, membership)
                        });
                    }
                })
                return await MembershipRequestModel.createMembershipRequest(sanitized, session)
                
            }
        });
    }
    
    async createMembershipRequest(meta, body, updater) {
        let { member_id, plan_id, pricing_id, member_type, status } = body;
        let creator = updater.id;

        if(!member_id || !ObjectId.isValid(member_id)) {
            throw new ValidationError("Invalid member ID");
        }

        const member = await MemberModel.findUserById(new ObjectId(member_id));
        if(!member) {
            throw new ValidationError("No member found")
        }

        if(!plan_id || !ObjectId.isValid(plan_id)) {
            throw new ValidationError("Invalid plan ID");
        }

        if(!pricing_id || !ObjectId.isValid(pricing_id)) {
            throw new ValidationError("Invalid pricing ID");
        }

        if(!creator || !ObjectId.isValid(creator)) {
            throw new ValidationError("Invalid admin ID");
        }
        
        if(!member_type) {
            throw new ValidationError("Request type is required");
        }

        if(!status) {
            throw new ValidationError("Status is required");
        }

        const plan = await PlanModel.viewAPlan(new ObjectId(plan_id));
        if(!plan) throw new ValidationError("Plan not found");

        const pricing = await PricingModel.getPricing(new ObjectId(pricing_id));

        if(!pricing) {
            throw new ValidationError("Pricing not found");
        }

        const sanitized = {
            member_id: new ObjectId(member_id),
            plan_id: new ObjectId(plan_id),
            pricing_id: new ObjectId(pricing_id),
            status: "draft", // draft | paid | pending_discount_review | ready_for_payment
            member_type: member_type.trim().toLowerCase() ?? "regular",
            createdAt: new Date(),
            createdBy: new ObjectId(creator),
            updatedAt: null,
            updatedBy: null
        }
        
        return await AuditLogsService.auditWrap({
            action: "MEMBERSHIP_REQUEST_CREATED",
            entity: "memberships_request",
            actor: { id: new ObjectId(updater.id), role: updater.role, user_type: updater.user_type }, 
            meta: meta,
            summary: `${updater.first_name} ${updater.last_name} ${updater.role-updater.user_type} created membership request for ${member.first_name} ${member.last_name}`,
            fn: async () => {
                await AuditLogsService.auditWrap({
                    action: "EMAIL_MEMBERSHIP_REQUESTED",
                    entity: "memberships",
                    actor: { id: new ObjectId(updater.id), role: updater.role, user_type: updater.user_type }, 
                    meta: meta,
                    summary: `${updater.first_name} ${updater.last_name} (${updater.role} → ${updater.user_type}) has been sent a membership request successful `,
                    fn: async () => {
                        await sendEmail({
                            to: member.email,
                            subject: "XFactor Fitness Gym Trece - Membership Request",
                            html: emailRequestMembership(member)
                        });
                    }
                })
                return await MembershipRequestModel.createMembershipRequest(sanitized);
            }
        });
        
    }

    async createMembership(meta, updater) {
        if(!updater.id || !ObjectId.isValid(updater.id)) throw new ValidationError("Invalid member ID");
        
        const request = await MembershipRequestModel.findMembershipRequestByMemberId(new ObjectId(updater.id));

        if(!request) {
            throw new ValidationError("Unable to find membership request");
        }

        const member = await MemberModel.findUserById(new ObjectId(request.member_id));
        if(!member) throw new ValidationError("No member found");

        const plan = await PlanModel.viewAPlan(new ObjectId(request.plan_id));
        if(!plan) throw new ValidationError("No plan found");

        const pricing = await PricingModel.getPricing(new ObjectId(request.pricing_id));
        if(!pricing) throw new ValidationError("No pricing found");

        const exist = await MembershipModel.alreadyHaveMembership(new ObjectId(request._id));

        if(exist) {
            return exist;
        }

        const endDate = await calculateEndDate(request.pricing_id);

        const membership = {
            label: plan.label,
            duration: pricing.label,
            duration_days: pricing.duration_days,
            price: pricing.price,
            membership_fee: pricing.membership_fee,
            member_type: member.member_type,
            start_date: new Date(),
            end_date: endDate
        }


        return await AuditLogsService.auditWrap({
            action: "MEMBERSHIP_CREATED",
            entity: "memberships",
            actor: { id: new ObjectId(updater.id), role: updater.role, user_type: updater.user_type }, 
            meta: meta,
            summary: `${updater.first_name} ${updater.last_name} (${updater.role} → ${updater.user_type}) approved membership creation request for ${member.first_name} ${member.last_name} `,
            fn: async () => {
                await AuditLogsService.auditWrap({
                    action: "MEMBERSHIP_EMAIL_WELCOME",
                    entity: "memberships",
                    actor: { id: new ObjectId(updater.id), role: updater.role, user_type: updater.user_type }, 
                    meta: meta,
                    summary: `${updater.first_name} ${updater.last_name} (${updater.role} → ${updater.user_type}) has been sent an email membership approved`,
                    fn: async () => {
                        await sendEmail({
                            to: member.email,
                            subject: `6Pack Iron City - Welcome to 6Pack Iron City, ${ucfirst(member.first_name)}!`,
                            html: emailMembershipActivated(member, membership)
                        });
                    }
                })
                return await MembershipModel.createMembership({
                    member_id: request.member_id,
                    plan_id: request.plan_id,
                    pricing_id: request.pricing_id,
                    start_date: new Date(),
                    end_date: endDate,
                    status: "active",
                    member_type: request.member_type,
                    is_frozen: false,
                    frozen_from: null,
                    frozen_til: null,
                    frozenBy: null,
                    unfrozenAt: null,
                    createdAt: new Date(),
                    createdBy: request.createdBy,
                    updatedAt: null,
                    updatedBy: null,
                    archivedAt: null,
                    archivedBy: null
                });
            }
        });
        

    }

    async createMembershipByAdmin(id, meta, updater) {
        if(!id || !ObjectId.isValid(id)) throw new ValidationError("Invalid membership request ID");
        if(!updater.id || !ObjectId.isValid(updater.id)) throw new ValidationError("Invalid admin ID");
        
        const request = await MembershipRequestModel.findMembershipByRequestId(new ObjectId(id));

        if(!request) {
            throw new ValidationError("Unable to find membership request");
        }

        const member = await MemberModel.findUserById(new ObjectId(request.member_id));
        if(!member) throw new ValidationError("No member found");

        const plan = await PlanModel.viewAPlan(new ObjectId(request.plan_id));
        if(!plan) throw new ValidationError("No plan found");

        const pricing = await PricingModel.getPricing(new ObjectId(request.pricing_id));
        if(!pricing) throw new ValidationError("No pricing found");

        const exist = await MembershipModel.alreadyHaveMembership(new ObjectId(request._id));

        if(exist) {
            return exist;
        }

        const endDate = await calculateEndDate(request.pricing_id);

        const membership = {
            label: plan.label,
            duration: pricing.label,
            duration_days: pricing.duration_days,
            price: pricing.price,
            membership_fee: pricing.membership_fee,
            member_type: member.member_type,
            start_date: new Date(),
            end_date: endDate
        }


        return await AuditLogsService.auditWrap({
            action: "MEMBERSHIP_CREATED",
            entity: "memberships",
            actor: { id: new ObjectId(updater.id), role: updater.role, user_type: updater.user_type }, 
            meta: meta,
            summary: `${updater.first_name} ${updater.last_name} (${updater.role} → ${updater.user_type}) approved membership creation request for ${member.first_name} ${member.last_name} `,
            fn: async () => {
                await AuditLogsService.auditWrap({
                    action: "MEMBERSHIP_EMAIL_WELCOME",
                    entity: "memberships",
                    entity_id: new ObjectId(id) ?? null,
                    actor: { id: new ObjectId(updater.id), role: updater.role, user_type: updater.user_type }, 
                    meta: meta,
                    summary: `${updater.first_name} ${updater.last_name} (${updater.role} → ${updater.user_type}) has been sent an email membership approved`,
                    fn: async () => {
                        await sendEmail({
                            to: member.email,
                            subject: `XFactor Fitness Gym Trece - Welcome to XFactor Fitness, ${ucfirst(member.first_name)}!`,
                            html: emailMembershipActivated(member, membership)
                        });
                    }
                })
                return await MembershipModel.createMembership({
                    member_id: request.member_id,
                    plan_id: request.plan_id,
                    pricing_id: request.pricing_id,
                    start_date: new Date(),
                    end_date: endDate,
                    status: "active",
                    member_type: request.member_type,
                    is_frozen: false,
                    frozen_from: null,
                    frozen_til: null,
                    frozenBy: null,
                    unfrozenAt: null,
                    createdAt: new Date(),
                    createdBy: request.createdBy,
                    updatedAt: null,
                    updatedBy: null,
                    archivedAt: null,
                    archivedBy: null
                });
            }
        });
        

    }

    async viewMembership(id) {
        if(!id || !ObjectId.isValid(id)) {
            throw new ValidationError("Invalid membership ID");
        }

        return await MembershipModel.viewMembership(new ObjectId(id));
    }

    async viewAllMembership(query) {
        let { start_date, end_date, status, is_frozen, search, page = 1, limit = 10} = query;
        
        let filter = {};
        page = Number(page);
        limit = Number(limit);

        if(start_date) {
            filter.end_date = { $gte: new Date(start_date) }; 
        }

        if(end_date) {
            filter.start_date = { $lte: new Date(end_date) }; 
        }

        if(status) {
            filter.status = status.trim().toLowerCase()
        }

        if(is_frozen !== undefined) {
            filter.is_frozen = is_frozen === "true" || is_frozen === true;
        }


        if(search) {
            search = search.trim().toLowerCase()
        }

        return await MembershipModel.viewAllMembership(filter, search, page, limit);
    }

    async updateMembership(id, meta, body, updater) {
        if(!id || !ObjectId.isValid(id)) {
            throw new ValidationError("Invalid membership ID");
        }

        if(body.plan_id && !ObjectId.isValid(body.plan_id)) {
            throw new ValidationError("Invalid plan ID");
        }

        if(body.pricing_id && !ObjectId.isValid(body.pricing_id)) {
            throw new ValidationError("Invalid pricing ID");
        }

        if(!updater.id || !ObjectId.isValid(updater.id)) {
            throw new ValidationError("Invalid updater ID");
        }  
        let startDate
        if(body.start_date) {
            startDate = new Date(body.start_date)
        }
        
        let endDate
        if(body.end_date) {
            endDate = new Date(body.end_date)
        }

        if(startDate && Number.isNaN(startDate.getTime())) {
            throw new ValidationError("Invalid start date format")
        }

        if(endDate && Number.isNaN(endDate.getTime())) {
            throw new ValidationError("Invalid end date format")
        }
        
        const exisitngMembership = await MembershipModel.viewMembership(new ObjectId(id));
        
        if(!exisitngMembership) {
            throw new ValidationError("Membership not found");
        }

        const member = await MemberModel.findUserById(new ObjectId(exisitngMembership.member_id));

        const updateData = {};

        if(!endDate && startDate) {
            const durationDays = await PricingModel.getPricing(exisitngMembership.pricing_id);
            
            updateData.end_date = new Date(startDate.getTime() + durationDays.duration_days * 24 * 60 * 60 * 1000);
        }

        if(endDate && !startDate) {
            const durationDays = await PricingModel.getPricing(exisitngMembership.pricing_id);
            
            updateData.end_date = new Date(startDate.getTime() - durationDays.duration_days * 24 * 60 * 60 * 1000);
        }

        if(endDate && startDate) {
            const pricing = await PricingModel.getPricing(exisitngMembership.pricing_id);
            const diffInDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);

            if(diffInDays !== pricing.duration_days) {
                throw new ValidationError(`Start date and End date should be ${pricing.duration_days} days apart`);
            }
        }

        let allowedFields;

        if(updater.role === "staff") {
            allowedFields = [
                "plan_id",
                "pricing_id"
            ];
        }

        if(updater.role === "admin" ) {
            allowedFields = [
                "plan_id",
                "pricing_id",
                "start_date",
                "end_date"
            ];
        }

        if(!allowedFields.length) {
            throw new ValidationError("Unauthorized Role");
        }
            
        for (const key of allowedFields) {
            const value = body[key];
            if (value !== undefined) {
                if (key === "plan_id" || key === "pricing_id") {
                    updateData[key] = new ObjectId(value);
                } else if (key === "start_date" || key === "end_date" || endDate) {
                    updateData[key] = new Date(value);
                }
            }
        }

        const updates = getChangedFields(exisitngMembership, updateData);

        if(Object.keys(updates).length) {
            updates.updatedAt = new Date()
            updates.updatedBy = new ObjectId(updater.id)
        } else {
            return;
        }

        const email = {
            first_name: member.first_name,
            last_name: member.last_name,
            plan_name,
            start_date,
            end_date,
            updatedBy,
            updatedAt
        };


        return await AuditLogsService.auditWrap({
            action: "MEMBERSHIP_UPDATE",
            entity: "memberships",
            entity_id: new ObjectId(id),
            actor: { id: new ObjectId(updater.id), role: updater.role, user_type: updater.user_type }, 
            meta: meta,
            changes: {
                patch: {
                    before: exisitngMembership,
                    after: updates
                }
            },
            summary: `${updater.first_name} ${updater.last_name} (${updater.role} → ${updater.user_type}) updated the membership info of ${member.first_name} ${member.last_name}`,
            fn: async () => {
                if (updates.plan_id || updates.pricing_id || updates.start_date || updates.end_date) {
                    await AuditLogsService.auditWrap({
                        action: "EMAIL_MEMBERSHIP_REQUEST",
                        entity: "memberships_request",
                        actor: { id: new ObjectId(updater.id), role: updater.role, user_type: updater.user_type }, 
                        meta: meta,
                        summary: `${updater.first_name} ${updater.last_name} (${updater.role} → ${updater.user_type}) has updated the membership info of ${member.first_name} ${member.last_name}`,
                        fn: async () => {
                            await sendEmail({
                                to: member.email,
                                subject: "XFactor Fitness Gym Trece - Membership Update",
                                html: membershipUpdatedEmail(email)
                            });
                        }
                    })
                }

                return await MembershipModel.updateMembership(
                    new ObjectId(id),
                    updates
                );
            }
        });
        
    }

    async updateMembershipStatus(id, meta, body, updater) {
        if (!id || !ObjectId.isValid(id)) {
            throw new ValidationError("Invalid membership ID");
        }

        let membership = await MembershipModel.viewMembership(new ObjectId(id));
        if (!membership) {
            throw new ValidationError("Membership not found");
        }

        if (!body.member_id || !ObjectId.isValid(body.member_id)) {
            throw new ValidationError("Invalid member ID");
        }

        if (!updater.id || !ObjectId.isValid(updater.id)) {
            throw new ValidationError("Invalid updater ID");
        }

        let status = String(body.status).trim().toLowerCase();
        let member_id = new ObjectId(body.member_id);
        const member = await MemberModel.findUserById(new ObjectId(member_id));
        if(!member) throw new ValidationError("No member found");

        if (!status) {
            throw new ValidationError("Missing status value");
        }

        const allowedStatus = ["active", "cancelled", "archived"];

        if (!allowedStatus.includes(status)) {
            throw new ValidationError("Invalid status value");
        }

        let updates = {
            status,
            updatedAt: new Date(),
            updatedBy: new ObjectId(updater.id)
        };

        const createMembershipRequest = async (statusValue) => {
            const sanitizedRequest = {
                member_id,
                plan_id: new ObjectId(membership.plan_id),
                pricing_id: new ObjectId(membership.pricing_id),
                status: statusValue,
                request_type: "cancellation",
                createdAt: new Date(),
                createdBy: new ObjectId(updater.id),
                updatedAt: new Date(),
                updatedBy: new ObjectId(updater.id)
            };
            return await AuditLogsService.auditWrap({
                action: "MEMBERSHIP_STATUS_UPDATED",
                entity: "memberships_request",
                actor: { id: new ObjectId(updater.id), role: updater.role, user_type: updater.user_type }, 
                meta: meta,
                summary: `${updater.first_name} ${updater.last_name} (${updater.role} → ${updater.user_type}) created membership cancellation request for ${member.first_name} ${member.last_name}`,
                fn: async () => {
                    await AuditLogsService.auditWrap({
                        action: "EMAIL_MEMBERSHIP_STATUS_UPDATED",
                        entity: "memberships",
                        entity_id: new ObjectId(id),
                        actor: { id: new ObjectId(updater.id), role: updater.role, user_type: updater.user_type }, 
                        meta: meta,
                        summary: `${updater.first_name} ${updater.last_name} (${updater.role} → ${updater.user_type}) has been sent 
                        an email notification about membership new status ${statusValue}`,
                        fn: async () => {
                            await sendEmail({
                                to: member.email,
                                subject: `XFactor Fitness Gym Trece - MEMBERSHIP ${statusValue}` ,
                                html: memberRegisteredEmail(member)
                            });
                        }
                    })
                    return await MembershipRequestModel.createMembershipRequest(sanitizedRequest);
                }
            });
        };

        let redirect;

        if (status === "cancelled") {
            const payment_method = String(body.payment_method || null).trim().toLowerCase();

            if (!payment_method) {
                throw new ValidationError("Payment method is required for cancellation");
            }

            let requestData = {
                plan_id: new ObjectId(membership.plan_id),
                pricing_id: new ObjectId(membership.pricing_id),
                ...body
            };

            if (payment_method === "cash") {
                const request = await createMembershipRequest("completed");

                const external_id = `cash-membership=${membership._id}-${Date.now()}`;

                await AuditLogsService.auditWrap({
                    action: "PAYMENT_CREATED",
                    entity: "payments",
                    actor: { id: new ObjectId(updater.id), role: updater.role, user_type: updater.user_type }, 
                    meta: meta,
                    summary: `${member.first_name} ${member.last_name} paid cash for request cancellation of membership`,
                    changes: {
                        patch: {
                            before: membership.status,
                            after: status
                        }
                    },
                    fn: async () => {
                        await PaymentModel.createPayment({
                            provider: "cash",
                            external_id,
                            amount: Number(body.amount),
                            status: "PAID",
                            payment_method: payment_method,
                            membership_request_id: request._id,
                            raw_response: null,
                            createdAt: new Date(),
                            createdBy: new ObjectId(updater.id),
                            updatedAt: new Date(),
                            updatedBy: new ObjectId(updater.id)
                        });
                    }
                });
                

            } else if (payment_method === "gcash") {
                const request = await this.createMembershipRequest(updater, requestData);

                requestData.membership_request_id = request.insertedId;

                redirect = await PaymentService.createGcashPayment(meta, requestData, updater);

            } else if (payment_method === "paymaya") {
                const request = await this.createMembershipRequest(updater, requestData);

                requestData.membership_request_id = request._id;
                redirect = await PaymentService.createMayaPayment(meta, requestData, updater);

            } else {
                throw new ValidationError("Invalid payment method");
            }
        }

        if (status === "archived") {
            updates.archivedAt = new Date();
            updates.archivedBy = new ObjectId(updater.id);
        }

        const email = {
            first_name: member.first_name,
            last_name: member.last_name,
            status,
            updatedAt,
            updatedBy
        };

        let updated = null;

        await AuditLogsService.auditWrap({
            action: "MEMBERSHIP_STATUS_UPDATED",
            entity: "memberships",
            entity_id: new ObjectId(id),
            actor: { id: new ObjectId(updater.id), role: updater.role, user_type: updater.user_type }, 
            meta: meta,
            summary: `${updater.first_name} ${updater.last_name} (${updater.role} → ${updater.user_type})`,
            fn: async () => {
                updated = await MembershipModel.updateMembershipStatus(new ObjectId(id), updates);
                await AuditLogsService.auditWrap({
                    action: "EMAIL_MEMBERSHIP_STATUS_UPDATED",
                    entity: "email",
                    actor: { id: new ObjectId(updater.id), role: updater.role, user_type: updater.user_type }, 
                    meta: meta,
                    summary: `${member.first_name} ${member.last_name} (${member.role-member.user_type}) has been sent an email notification about membership status update`,
                    fn: async () => {
                        await sendEmail({
                            to: member.email,
                            subject: `XFactor Fitness Gym Trece - Membership ${status} Updated`,
                            html: membershipUpdatedEmail(email)
                        });
                    }
                })
            }
        });
        

        return  {
            redirect: redirect.checkout_url, 
            external_id: redirect.external_id,
            updated: updated
        }
    }


    async freezeMembership(id, meta, body, updater) {
        if(!id || !ObjectId.isValid(id)) {
            throw new ValidationError("Invalid membership ID");
        }

        const membership = await MembershipModel.viewMembership(new ObjectId(id));

        if(!membership) {
            throw new ValidationError("Membership not found");
        }

        const plan = await PlanModel.viewAPlan(new ObjectId(membership.plan_id));

        const member = await MemberModel.findUserById(new ObjectId(membership.member_id));
        if(!member) throw new ValidationError("No member found");

        if(membership.status !== "active") {
            throw new ValidationError("Only active membership can be freeze");
        }

        if(membership.is_frozen) {
            throw new ValidationError("Membership is already frozen");
        }

        if(!updater.id || !ObjectId.isValid(updater.id)) {
            throw new ValidationError("Invalid updater ID");
        }

        const price = await PricingModel.getPricing(new ObjectId(membership.pricing_id));

        if(price.duration_days < 180) {
            throw new ValidationError("Member must be in 6 months to 1 year plan membership");
        }

        let startDate = body.start_date ? new Date(body.start_date) : new Date();
        let endDate = body.end_date ? new Date(body.end_date) : null;
        if(body.start_date) {
            startDate = new Date(body.start_date)
        }

        if(body.end_date) {
            endDate = new Date(body.end_date)
        }

        if(startDate && Number.isNaN(startDate.getTime())) {
            throw new ValidationError("Invalid start date format")
        }

        if(endDate && Number.isNaN(endDate.getTime())) {
            throw new ValidationError("Invalid end date format")
        }

        if(!endDate) {
            endDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000)
        } 

        const freezeDays = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24));
        if(freezeDays < 30) throw new ValidationError("Minimum freeze is 1 month");
        if(freezeDays > 90) throw new ValidationError("Minimum freeze is 1 month");

        const data = {
            is_frozen: true,
            frozen_from: startDate || new Date(),
            frozen_til: endDate, 
            frozenAt: new Date(),
            frozenBy: new ObjectId(updater.id),
            updatedAt: new Date(),
            updatedBy: new ObjectId(updater.id)
        }

        const frozenByName = `${ucfirst(updater.first_name)}  ${ucfirst(updater.last_name)}`

        const email = {
            first_name: member.first_name,
            last_name: member.last_name,
            name: plan.label,
            start_date: membership.start_date,
            end_date: membership.end_date,
            frozen_from: startDate,
            frozen_til: endDate,
            frozenBy: frozenByName,
            updatedAt: new Date()
        }

        return await AuditLogsService.auditWrap({
            action: "MEMBERSHIP_FREEZED",
            entity: "memberships",
            entity_id: new ObjectId(id),
            actor: { id: new ObjectId(updater.id), role: updater.role, user_type: updater.user_type }, 
            meta: meta,
            summary: `${updater.first_name} ${updater.last_name} (${updater.role} → ${updater.user_type}) has frozed the membership of ${member.first_name} ${member.last_name}`,
            changes: {
                patch: {
                    before: membership,
                    after: data
                }
            },
            fn: async () => {
                await AuditLogsService.auditWrap({
                    action: "EMAIL_MEMBERSHIP_FREEZED",
                    entity: "membership",
                    entity_id: new ObjectId(id),
                    actor: { id: new ObjectId(updater.id), role: updater.role, user_type: updater.user_type }, 
                    meta: meta,
                    summary: `${updater.first_name} ${updater.last_name} (${updater.role} → ${updater.user_type}) has been send an email notification about membership freezed `,
                    fn: async () => {
                        await sendEmail({
                            to: member.email,
                            subject: "XFactor Fitness Gym Trece - Freeze Membership",
                            html: membershipFrozenEmail(email)
                        });
                    }
                })
                return await MembershipModel.freezeMembership(
                    new ObjectId(id),
                    data
                );
            }
        });
        
    }

    async unfreezeMembership(id, updater) {
        if(!id || !ObjectId.isValid(id)) {
            throw new ValidationError("Invalid membership ID");
        }

        const membership = await MembershipModel.viewMembership(new ObjectId(id));

        if(!membership) {
            throw new ValidationError("Membership not found");
        }

        if(!membership.is_frozen) {
            throw new ValidationError("Membership is not frozen");
        }

        if(!updater.id || !ObjectId.isValid(updater.id)) {
            throw new ValidationError("Invalid updater ID");
        }

        const data = {
            is_frozen: false,
            frozenAt: null,
            frozenBy: null,
            frozen_from: null,
            frozen_til: null, 
            unfrozenAt: new Date(),
            updatedAt: new Date(),
            updatedBy: new ObjectId(updater.id)
        }  

        return await AuditLogsService.auditWrap({
            action: "MEMBERSHIP_UNFREEZED",
            entity: "memberships",
            entity_id: new ObjectId(id),
            actor: { id: new ObjectId(updater.id), role: updater.role, user_type: updater.user_type }, 
            meta: meta,
            summary: `${updater.first_name} ${updater.last_name} (${updater.role} → ${updater.user_type}) has unfrozed the membership of ${member.first_name} ${member.last_name}`,
            changes: {
                patch: {
                    before: membership,
                    after: data
                }
            },
            fn: async () => {
                await AuditLogsService.auditWrap({
                    action: "EMAIL_MEMBERSHIP_UNFREEZED",
                    entity: "memberships",
                    entity_id: member._id ?? null,
                    actor: { id: new ObjectId(updater.id), role: updater.role, user_type: updater.user_type }, 
                    meta: meta,
                    summary: `${updater.first_name} ${updater.last_name} (${updater.role} → ${updater.user_type}) has been sent an email notification about unfroze of membership`,
                    fn: async () => {
                        await sendEmail({
                            to: member.email,
                            subject: "XFactor Fitness Gym Trece - UNFREEZE MEMBERSHIP",
                            html: memberRegisteredEmail(member)
                        });
                    }
                })
                await MembershipModel.unfreezeMembership(
                    new ObjectId(id),
                    data
                );
            }
        });

        
    }

    async fetchAllMembershipRequests(query) {
        let { status, search, page = 1, limit = 10, request_type } = query;
        
        let filter = {};
        page = Number(page);
        limit = Number(limit);

        if (!Number.isInteger(page) || page < 1) page = 1;
        if (!Number.isInteger(limit) || limit < 1 || limit > 50) limit = 10;

        if(status) {
            filter.status = status.trim().toLowerCase()
        }

        if(request_type) {
            // Support filtering by request_type: 'cancellation' or 'creation'
            filter.request_type = { $in: request_type.split(',') };
        }

        if(search) {
            search = search.trim().toLowerCase()
        }

        return await MembershipRequestModel.fetchAllMembershipRequests(filter, search, page, limit);
    }
}

export default new MembershipService();
