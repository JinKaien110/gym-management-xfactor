import { ObjectId } from "mongodb";
import { axiosInstance } from "../config/xendit.js";
import PaymentModel from "../models/PaymentModel.js";
import MembershipService from "../services/membership.service.js";
import MembershipModel from "../models/MembershipModel.js";
import MembershipRequestModel from "../models/MembershipRequestModel.js";
import MemberModel from "../models/MemberModel.js";
import { ValidationError } from "../errors/ValidationError.js";



class PaymentService {
    async createGcashPayment(body, updater) {
        try {
        let { membership_request_id, amount, payment_method } = body;

        if(!membership_request_id || !ObjectId.isValid(membership_request_id)) {
            throw new Error("Invalid membership request ID")
        }

        if(!payment_method) {
            throw new Error("Payment method is required");
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
            throw new Error("Invalid amount");
        }

        const external_id = `membership=${id}-${Date.now()}`;

        const payload ={
            reference_id: external_id,
            currency: "PHP",
            amount: amount,
            channel_code: "PH_GCASH",
            checkout_method: "ONE_TIME_PAYMENT",
            channel_properties: {
                success_redirect_url: "https://localhost:3000/payment/success",
                failure_redirect_url: "https://localhost:3000/payment/failed",
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

        await PaymentModel.createPayment({
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

    async createMayaPayment(body, updater) {
        let { membership_request_id, amount, payment_method } = body;

        if(!membership_request_id || !ObjectId.isValid(membership_request_id)) {
            throw new Error("Invalid membership request ID");
        }

        if(!updater.id || !ObjectId.isValid(updater.id)) {
            throw new Error("Invalid updater ID");
        }

        if(!payment_method) {
            throw new Error("Payment method is required");
        }

        payment_method = payment_method.trim().toLowerCase();
        amount = Number(amount)

        if(payment_method === "gcash") {
            return this.createGcashPayment(body, updater)
        }

        if(!amount || amount <= 0) {
            throw new Error("Invalid amount");
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

        const external_id = `membership=${id}-${Date.now()}`;

        const payload = {
            reference_id: external_id,
            currency: "PHP",
            amount: amount,
            checkout_method: "REDIRECT",
            channel_code: "PH_PAYMAYA",
            channel_properties: {
                success_redirect_url: "https://localhost:3000/payment/success",
                failure_redirect_url: "https://localhost:3000/payment/failed",
            },
            metadata: {
                membership_request_id: id,
                givenNames: updater.first_name,
                surname: updater.last_name,
                email: updater.email
            }
        }

        const response = await axiosInstance.post("/ewallets/charges", payload);
        
        await PaymentModel.createPayment({
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

        const action = response.data.actions;
        return {
            checkout_url: action.mobile_web_checkout_url ?? action.desktop_web_checkout_url,
            external_id
        }

    }

    async markPaymentPaid(id, payload) {
        if (!id || typeof id !== "string") {
            throw new Error("Invalid external ID");
        }

        const payment = await PaymentModel.findByExternalID(id);

        if(!payment) throw new Error("Payment not found");

        if (payment.status === "PAID") return;

        await MembershipService.createMembership(payment.membership_request_id);

        const updateStatus = "completed";

        await MembershipRequestModel.updateMembershipStatus(new ObjectId(payment.membership_request_id), updateStatus)

        return PaymentModel.updateStatusByExternalID(id, {
            status: "PAID",
            raw_response: payload,
            updatedAt: new Date(),
            updatedBy: "xendit-webhook"
        });
    }

    async markPaymentFailed(id, payload) {
        if (!id || typeof id !== "string") {
            throw new Error("Invalid external ID");
        }

        const payment = await PaymentModel.findByExternalID(external_id);

        if(!payment) throw new Error("Payment not found");

        if (payment.status === "FAILED") return;

        const updateStatus = "completed";

        await MembershipRequestModel.updateMembershipStatus(new ObjectId(payment.membership_request_id), updateStatus)

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
}

export default new PaymentService();