import { ValidationError } from "../errors/ValidationError.js";
import DiscountRequestModel from "../models/DiscountRequestModel.js";
import MemberModel from "../models/MemberModel.js";
import MembershipModel from "../models/MembershipModel.js";
import MembershipRequestModel from "../models/MembershipRequestModel.js";
import AuditLogsService from "./audit.logs.service.js"; 
import { ObjectId } from "mongodb";

class DiscountRequestService {

    async createDiscountRequest(meta, body, updater) {
        let { selfie_url, id_url } = body;

        if(!updater.id || !ObjectId.isValid(updater.id)) {
            throw new ValidationError("Invalid member ID");
        }
        if (!selfie_url || typeof selfie_url !== "string") throw new ValidationError("Selfie is required");
        if (!id_url || typeof id_url !== "string") throw new ValidationError("ID photo is required");
        if (selfie_url.length > 500) throw new ValidationError("Selfie URL too long");
        if (id_url.length > 500) throw new ValidationError("ID URL too long");


        const membershipRequest = await MembershipRequestModel.findMembershipByRequestId(new ObjectId(updater.id));
        if(!membershipRequest) throw new ValidationError("No membership request found");

        const data = {
            member_id: new ObjectId(updater.id),
            membership_request_id: new ObjectId(membershipRequest._id),
            selfie_url: selfie_url.trim(),
            id_url: id_url.trim(),
            status: "submitted",
            createdAt: new Date(),
            createdBy: new ObjectId(updater.id)
        }

        return await AuditLogsService.auditWrap({
            action: "CREATE_DISCOUNT_REQUEST",
            entity: "discount_requests",
            actor: { id: new ObjectId(updater.id), role: updater.role }, 
            meta: meta,
            summary: `Discount request was requested by ${updater.first_name} ${updater.last_name}`,
            fn: async () => {
                return await DiscountRequestModel.createDiscountRequest(data);
            }
        }); 
    }

    async decisionOnDiscountRequest(id, meta, decision, updater) {
        if(!id || !ObjectId.isValid(id)) {
            throw new ValidationError("Invalid discount request ID");
        }

        const discountRequest = await DiscountRequestModel.findDiscountRequestById(new ObjectId(id));
        if(!discountRequest) throw new ValidationError("No discount request found");

        if(!decision) {
            throw new ValidationError("No decision value");
        }

        if(!updater.id || !ObjectId.isValid(updater.id)) {
            throw new ValidationError("Invalid admin/staff ID");
        }

        const allowedDecisions = ["rejected", "ready_for_payment"]
        if(!allowedDecisions.includes(decision)) {
            throw new ValidationError("Invalid decision value");
        }

        const now = new Date();
        const discountData = {
            decision: decision.trim().toLowerCase(),
            updatedAt: now,
            updatedBy: new ObjectId(updater.id)
        };

        const memberData = {
            updatedAt: now,
            updatedBy: new ObjectId(updater.id)
        }

        if(decision === "ready_for_payment") {
            memberData.member_type = "discounted"
        }
        
    
        return await AuditLogsService.auditWrap({
            action: "DECISION_ON_DISCOUNT_MADE",
            entity: "decision_requests",
            entity_id: new ObjectId(updater.id) ?? null,
            actor: { id: new ObjectId(updater.id), role: updater.role }, 
            meta: meta,
            summary: `Discount request was ${decision} on decision request ${id}`,
            fn: async () => {
                const { client } = await connectDB();
                const session = client.startSession();

                try {
                    session.startTransaction();
                    await DiscountRequestModel.decisionOnDiscountRequest(id, discountData, session);
                    await MemberModel.updateMember(new ObjectId(discountRequest.member_id), memberData, session)
                    await session.commitTransaction();
                } catch (error) {
                    await session.abortTransaction();
                    throw new ValidationError(error.message)
                } finally {
                    await session.endSession();
                }
            }
        });
    }
}

export default new DiscountRequestService();