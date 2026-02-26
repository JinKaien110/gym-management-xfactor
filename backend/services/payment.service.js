import { ObjectId } from "mongodb";
import { axiosInstance } from "../config/xendit.js";
import PaymentModel from "../models/PaymentModel.js";
import MembershipService from "../services/membership.service.js";
import MembershipModel from "../models/MembershipModel.js";
import MembershipRequestModel from "../models/MembershipRequestModel.js";
import MemberModel from "../models/MemberModel.js";
import { ValidationError } from "../errors/ValidationError.js";
import ucfirst from "../utils/ucfirst.js";
import { paymentSuccessEmail } from "../templates/payment/email.paymentSuccessEmail.js";
import AuditLogsService from "./audit.logs.service.js";
import DiscountRequestService from "./discountrequest.service.js";
import DiscountRequestModel from "../models/DiscountRequestModel.js";
import { sendEmail } from "./email.service.js";



class PaymentService {
    async createGcashPayment(meta, body, updater) {
        try {
        let { membership_request_id, amount, payment_method } = body;

        if(!membership_request_id || !ObjectId.isValid(membership_request_id)) {
            throw new ValidationError("Invalid membership request ID")
        }

        if(!payment_method) {
            throw new ErValidationErrorror("Payment method is required");
        }

        payment_method = payment_method.trim().toLowerCase();

        amount = Number(amount);

        if(payment_method === "paymaya") {
            return this.createMayaPayment(body, updater);
        }

        const id = new ObjectId(membership_request_id);
        const membershipRequest = await MembershipRequestModel.findMembershipByRequestId(id);

        if(!membershipRequest) {
            throw new ValidationError("Membership request failed to fetch")
        }

        const memberDetails = await MemberModel.FindUserById(new ObjectId(membershipRequest.member_id));
        if(!memberDetails) {
            throw new ValidationError("Member details failed to fetch")
        }
       

        if(!amount || amount <= 0) {
            throw new ValidationError("Invalid amount");
        }

        const external_id = `membership=${id}-${Date.now()}`;

        const payload ={
            reference_id: external_id,
            currency: "PHP",
            amount: amount,
            channel_code: "PH_GCASH",
            checkout_method: "ONE_TIME_PAYMENT",
            channel_properties: {
                success_redirect_url: "https://localhost:5173/payment/success",
                failure_redirect_url: "https://localhost:5173/payment/failed",
            },
            payer_email: updater.email,
            metadata: {
                membership_request_id: id,
                givenNames: updater.first_name,
                surname: updater.last_name,
                email: updater.email
            }
        }

        const response = await axiosInstance.post("/ewallets/charges", payload);

        const memberData = {
            member_type: membershipRequest.member_type,
            updatedAt: new Date(),
            updatedBy: new ObjectId(updater.id),
        }
        

        await AuditLogsService.auditWrap({
            action: "PAYMENT_CREATED",
            entity: "payments",
            actor: { id: new ObjectId(updater.id), role: updater.role, user_type: updater.user_type }, 
            meta: meta,
            summary: `${updater.first_name} ${updater.last_name} (${updater.role} → ${updater.user_type}) has created a payment using GCASH`,
            fn: async () => {

                await MemberModel.updateMember(new ObjectId(memberDetails._id), memberData);
                await PaymentModel.createPayment({
                    member_id: new ObjectId(memberDetails._id),
                    first_name: memberDetails.first_name,
                    last_name: memberDetails.last_name,
                    provider: "xendit",
                    external_id: external_id,
                    amount: amount,
                    status: "PENDING",
                    member_type: "regular", 
                    payment_method: payment_method,
                    membership_request_id: id,
                    raw_response: response.data,
                    createdAt: new Date(),
                    createdBy: new ObjectId(updater.id),
                    updatedAt: new Date(),
                    updatedBy: new ObjectId(updater.id)
                });
            }
        });
        
        return {
            checkout_url: response.data.actions.desktop_web_checkout_url,
            external_id: external_id
        }

        } catch (error) {
            console.error("Xendit status:", error.response?.status);
        console.error("Xendit data:", error.response?.data);
        throw error
        }
        
       
    }

    async createMayaPayment(meta, body, updater) {
        try {
            let { membership_request_id, amount, payment_method } = body;

            
        if(!membership_request_id || !ObjectId.isValid(membership_request_id)) {
            throw new ValidationError("Invalid membership request ID");
        }

        if(!updater.id || !ObjectId.isValid(updater.id)) {
            throw new ValidationError("Invalid updater ID");
        }

        if(!payment_method) {
            throw new ValidationError("Payment method is required");
        }

        payment_method = payment_method.trim().toLowerCase();
        amount = Number(amount)

        if(payment_method === "gcash") {
            return this.createGcashPayment(body, updater)
        }

        if(!amount || amount <= 0) {
            throw new ValidationError("Invalid amount");
        }

        const id = new ObjectId(membership_request_id);
        const membershipRequest = await MembershipRequestModel.findMembershipByRequestId(id);

        if(!membershipRequest) {
            throw new ValidationError("Membership request failed to fetch")
        }

        const memberDetails = await MemberModel.findUserById(new ObjectId(membershipRequest.member_id));
        if(!memberDetails) {
            throw new ValidationError("Member details failed to fetch")
        }

        const external_id = `membership=${id}-${Date.now()}`;


        const payload = {
            reference_id: external_id,
            currency: "PHP",
            amount,
            checkout_method: "ONE_TIME_PAYMENT",
            channel_code: "PH_PAYMAYA",
            channel_properties: {
                success_redirect_url: "https://localhost:5173/payment/success",
                failure_redirect_url: "https://localhost:5173/payment/failed",
                cancel_redirect_url: "https://localhost:5173/payment/cancel"
            },
            metadata: {
                givenNames: updater.first_name || memberDetails.first_name,
                surname: updater.last_name || memberDetails.last_name,
                email: updater.email || memberDetails.email
            }
        }

        const response = await axiosInstance.post("/ewallets/charges", payload);
        
        const memberData = {
            member_type: membershipRequest.member_type,
            updatedAt: new Date(),
            updatedBy: new ObjectId(updater.id),
        }

        const discountData = {
            status: "paid",
            updatedAt: new Date(),
            updatedBy: new ObjectId(updater.id),
        }

        
        
        
        await AuditLogsService.auditWrap({
            action: "PAYMENT_CREATED",
            entity: "payments",
            actor: { id: new ObjectId(updater.id), role: updater.role, user_type: updater.user_type }, 
            meta: meta,
            summary: `${updater.first_name} ${updater.last_name} (${updater.role} → ${updater.user_type}) has created a payment using PAYMAYA`,
            fn: async () => {

                return await PaymentModel.createPayment({
                    member_id: new ObjectId(memberDetails._id),
                    first_name: memberDetails.first_name,
                    last_name: memberDetails.last_name,
                    provider: "xendit",
                    external_id: external_id,
                    amount: amount,
                    status: "PENDING",
                    payment_method: payment_method,
                    membership_request_id: id,
                    raw_response: response.data,
                    createdAt: new Date(),
                    createdBy: new ObjectId(updater.id),
                    updatedAt: new Date(),
                    updatedBy: new ObjectId(updater.id)
                });
            }
        });
        
        await DiscountRequestModel.updateMembershipStatusByMembershipRequestId(new ObjectId(membershipRequest._id), discountData);
        await MemberModel.updateMember(new ObjectId(memberDetails._id), memberData);
        await MembershipService.createMembership(meta, updater);
        const action = response.data.actions;
        return {
            checkout_url: action.mobile_web_checkout_url ?? action.desktop_web_checkout_url,
            external_id
        }

        } catch (error) {
            console.log("Xendit error:", error.response.data);
        }
    }

    async markPaymentPaid(id, payload) {
        if (!id || typeof id !== "string") {
            throw new ValidationError("Invalid external ID");
        }

        const payment = await PaymentModel.findByExternalID(id);

        const membershipRequest = await MembershipRequestModel.findMembershipByRequestId(new ObjectId(payment.membership_request_id));

        const member = await MemberModel.findUserById(new ObjectId(payment.member_id));

        if(!payment) throw new ValidationError("Payment not found");

        if (payment.status === "PAID") return;

        const data = {
            status: "completed",
            updatedAt: new Date(),
            updatedBy: "xendit-webhook"
        }

        await MembershipRequestModel.updateMembershipStatus(new ObjectId(payment.membership_request_id), data)
        
        const email = {
            first_name: payment.first_name,
            last_name: payment.last_name,
            amount: payment.amount,
            payment_method: payment.payment_method,
            external_id: id,
            membership_request_id: String(payment.membership_request_id),
            member_type: membershipRequest.member_type,
            createdAt: new Date()
        }

        await AuditLogsService.auditWrap({
            action: "EMAIL_PAYMENT_GCASH_CREATED",
            entity: "payments",
            actor: { id: new ObjectId(member._id), role: member.role, user_type: member.user_type }, 
            summary: `${member.first_name} ${member.last_name} (${member.role-member.user_type}) has been sent an email notification about success ${ucfirst(payment.payment_method)} payment`,
            fn: async () => {
                await sendEmail({
                    to: member.email,
                    subject: `XFactor Fitness Gym Trece - Payment ${ucfirst(payment.payment_method)}`,
                    html: paymentSuccessEmail(email)
                });
            }
        })

        return PaymentModel.updateStatusByExternalID(id, {
            status: "PAID",
            raw_response: payload,
            updatedAt: new Date(),
            updatedBy: "xendit-webhook"
        });

    }

    async markPaymentFailed(id, payload) {
        if (!id || typeof id !== "string") {
            throw new ValidationError("Invalid external ID");
        }

        const payment = await PaymentModel.findByExternalID(external_id);

        if(!payment) throw new ValidationError("Payment not found");

        if (payment.status === "FAILED") return;

        const data = {
            status: "completed",
            updatedAt: new Date(),
            updatedBy: "xendit-webhook"
        }

        await MembershipRequestModel.updateMembershipStatus(new ObjectId(payment.membership_request_id), data)

        return PaymentModel.updateStatusByExternalID(id, {
            status: "FAILED",
            raw_response: payload,
            updatedAt: new Date(),
            updatedBy: "xendit-webhook"
        });
    }

    async getAllPayment(query) {
        let { payment_method, status, search, page = 1, limit = 10 } = query;

        let filter =  {};

        if(payment_method) {
            filter.payment_method = payment_method.trim().toLowerCase()
        }

        if(status) {
            filter.status = status.trim().toLowerCase()
        }

        return await PaymentModel.getAllPayment(filter, search, page, limit);
    }

    async getPaymentDetails(id) {
        if(!id || !ObjectId.isValid(id)) {
            throw new ValidationError("Invalid payment ID");
        }

        return await PaymentModel.getPaymentDetails(new ObjectId(id));
    }

    async getTotalRevenue(query) {
        let { status } = query;

        let filter = {};

        // Default to only successful payments if no status specified
        if (!status) {
            filter.status = { $in: ["PAID", "paid", "COMPLETED", "completed"] };
        } else {
            filter.status = status.trim().toLowerCase();
        }

        return await PaymentModel.getTotalRevenue(filter);
    }

}

export default new PaymentService();