import { ValidationError } from "../errors/ValidationError.js";
import DiscountRequestModel from "../models/DiscountRequestModel.js";
import MemberModel from "../models/MemberModel.js";
import MembershipModel from "../models/MembershipModel.js";
import MembershipRequestModel from "../models/MembershipRequestModel.js";
import PlanModel from "../models/PlanModel.js";
import PricingModel from "../models/PricingModel.js";
import AuditLogsService from "./audit.logs.service.js"; 
import { ObjectId } from "mongodb";
import { sendEmail } from "./email.service.js";
import { memberDiscountRequestEmail } from "../templates/discount/email.memberRequestDiscount.js";
import { memberDiscountDecisionEmail } from "../templates/discount/email.memberDiscountDecision.js";
import { connectDB } from "../config/db.js";

class DiscountRequestService {

    async createDiscountRequest(meta, files, updater) {
        const selfie_url = files.selfie_url?.[0];
        const id_url = files.id_url?.[0];


        if(!updater.id || !ObjectId.isValid(updater.id)) {
            throw new ValidationError("Invalid member ID");
        }
        if (!selfie_url) throw new ValidationError("Selfie is required");
        if (!id_url) throw new ValidationError("ID photo is required");

        const MAX_SIZE = 25 * 1024 * 1024
        if (selfie_url.size > MAX_SIZE) throw new ValidationError("Selfie URL too long");
        if (id_url.size > MAX_SIZE) throw new ValidationError("ID URL too long");


        const membershipRequest = await MembershipRequestModel.findMembershipRequestByMemberId(new ObjectId(updater.id));
        if(!membershipRequest) throw new ValidationError("No membership request found");

        const plan = await PlanModel.viewAPlan(membershipRequest.plan_id);

        const pricing = await PricingModel.viewPricingByPlan(membershipRequest.plan_id);

        const data = {
            member_id: new ObjectId(updater.id),
            membership_request_id: new ObjectId(membershipRequest._id),
            selfie_url: selfie_url.path,
            id_url: id_url.path,
            status: "submitted",
            reviewed_at: null,
            reviewed_by: null,
            createdAt: new Date(),
            createdBy: new ObjectId(updater.id)
        }

        const email = {
            first_name: updater.first_name,
            last_name: updater.last_name,
            email: updater.email,
            discount_type: plan.label,       
            price: pricing.price,
            status: "pending", // pending | approved | rejected
            requested_at: new Date()
        }


        return await AuditLogsService.auditWrap({
            action: "DISCOUNT_REQUEST_CREATED",
            entity: "discount_requests",
            actor: { id: new ObjectId(updater.id), role: updater.role, user_type: updater.user_type }, 
            meta: meta,
            summary: `${updater.first_name} ${updater.last_name} (${updater.role} → ${updater.user_type}) requested a discount`,
            fn: async () => {
                await AuditLogsService.auditWrap({
                    action: "EMAIL_DISCOUNT_REQUEST_CREATED",
                    entity: "discount_requests",
                    actor: { id: new ObjectId(updater.id), role: updater.role, user_type: updater.user_type }, 
                    meta: meta,
                    summary: `${updater.first_name} ${updater.last_name} (${updater.role} → ${updater.user_type}) has been sent a discount request email`,
                    fn: async () => {
                        await sendEmail({
                            to: updater.email,
                            subject: "6Pack Iron City Gym - Discount Request Received",
                            html: memberDiscountRequestEmail(email)
                        });
                        return await DiscountRequestModel.createDiscountRequest(data);
                    }
                    
                })
                
            }
        }); 
    }

    async decisionOnDiscountRequest(id, meta, decision, updater) {
        if(!id || !ObjectId.isValid(id)) {
            throw new ValidationError("Invalid discount request ID");
        }

        const decisionNormalized = String(decision || "").trim().toLowerCase();
        if(!decisionNormalized) {
            throw new ValidationError("No decision value");
        }

        const allowedDecisions = ["rejected", "approved"]
        if(!allowedDecisions.includes(decisionNormalized)) {
            throw new ValidationError("Invalid decision value");
        }
        

        return await AuditLogsService.auditWrap({
            action: "DISCOUNT_REQUEST_DECISION",
            entity: "discount_requests",
            entity_id: new ObjectId(id),
            actor: { id: new ObjectId(updater.id), role: updater.role }, 
            meta: meta,
            summary: `${updater.first_name} ${updater.last_name} (${updater.role} → ${updater.user_type}) has ${decisionNormalized} the discount request ${String(id)}`,
            fn: async () => {
                
                const { db, client } = await connectDB();
                const session = client.startSession();
                try {
                    session.startTransaction();
                    
        
        
        const discountRequest = await DiscountRequestModel.findDiscountRequestById(new ObjectId(id), session);
        if(!discountRequest) throw new ValidationError("No discount request found");
                    
        const membershipRequest = await MembershipRequestModel.findMembershipByRequestId(new ObjectId(discountRequest.membership_request_id), session)
        if(!membershipRequest) throw new ValidationError("No membership request found");
        
        const member = await MemberModel.findUserById(new ObjectId(membershipRequest.member_id));

        const plan = await PlanModel.viewAPlan(new ObjectId(membershipRequest.plan_id));

        const pricing = await PricingModel.viewPricingByPlan(new ObjectId(membershipRequest.plan_id))
        

        if(!updater.id || !ObjectId.isValid(updater.id)) {
            throw new ValidationError("Invalid admin/staff ID");
        }

        

        const now = new Date();
        const discountData = {
            status: decisionNormalized.trim().toLowerCase(),
            reviewed_at: now,
            reviewed_by: new ObjectId(updater.id),
            updatedAt: now,
            updatedBy: new ObjectId(updater.id)
        };

        const membershipData = {
            updatedAt: now,
            updatedBy: new ObjectId(updater.id)
        }

        if(decisionNormalized === "approved") {
            membershipData.status = "ready_for_payment"
        }

        if(decisionNormalized === "rejected") {
            membershipData.status = "ready_for_payment"
        }   
        const email = {
            first_name: member.first_name,
            last_name: member.last_name,
            email: member.email,

            discount_type: plan.label, 
            decision: decisionNormalized,
            member_type: decisionNormalized === "approved" ? "Discounted" : "Regular",

            reviewed_by: `${updater.first_name} ${updater.last_name}`,
            reviewed_at: now,

            price: pricing.price,
            membership_fee: pricing.membership_fee
        };


        

        
                
        
                


                    const decisionMade = await DiscountRequestModel.decisionOnDiscountRequest(new ObjectId(id), discountData, session);

                    // MEMBERSHIP REQUEST COLLECTION
                    await MembershipRequestModel.updateMembershipStatus(new ObjectId(membershipRequest._id), membershipData, session);
                    

                    await session.commitTransaction();

                    // RETURN DECISION MADE DB RETURN VALUE FOR ENTITY ID :D 

                    await AuditLogsService.auditWrap({
                    action: "EMAIL_DISCOUNT_DECISION",
                    entity: "discount_requests",
                    entity_id: new ObjectId(id),
                    actor: { id: new ObjectId(updater.id), role: updater.role, user_type: updater.user_type }, 
                    meta: meta,
                    summary: `${updater.first_name} ${updater.last_name} (${updater.role} → ${updater.user_type}) has been sent the discount request decision email`,
                    fn: async () => {
                        return await sendEmail({
                            to: member.email,
                            subject: `6Pack Iron City - Discount ${decisionNormalized === "approved" ? "Approved" : "Decision"}`,
                            html: memberDiscountDecisionEmail(email)
                        });
                    }
                });
                    return decisionMade;
                } catch (error) {
                    await session.abortTransaction();
                    throw new ValidationError(error.message)
                } finally {
                    await session.endSession();
                }
                
            }
        });
    }

    async findDiscountRequestById(id, user) {
        if(!id || !ObjectId.isValid(id)) {
            throw new ValidationError("Invalid discount request ID");
        }

        const discountRequest = await DiscountRequestModel.findDiscountRequestById(new ObjectId(id));
        if(!discountRequest) throw new ValidationError("No discount request found");
        
        return discountRequest;
    }

    async getAllDiscountRequests(query) {
        let { member_id, status, page = 1, limit = 10 } = query;

        page = Number(page);
        limit = Number(limit);

        if (!Number.isInteger(page) || page < 1) page = 1;
        if (!Number.isInteger(limit) || limit < 1 || limit > 50) limit = 10;

        const filter = {};
        if(member_id && ObjectId.isValid(member_id)) {
            filter.member_id = new ObjectId(member_id);
        }
        if(status && typeof status === "string") {
            filter.status = status.trim().toLowerCase();
        }

        return await DiscountRequestModel.getAllDiscountRequests(filter, page, limit);
    }
}

export default new DiscountRequestService();