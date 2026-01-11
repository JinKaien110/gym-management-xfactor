import { ObjectId } from "mongodb";
import { axiosInstance } from "../config/xendit.js";
import PaymentModel from "../models/PaymentModel.js";
import MembershipService from "../services/membership.service.js";
import MembershipModel from "../models/MembershipModel.js";
import MembershipRequestModel from "../models/MembershipRequestModel.js";


class PaymentService {
    async createGcashPayment(body, updater) {
        try {
             let { membership_request_id, amount } = body;

        if(!membership_request_id || !ObjectId.isValid(membership_request_id)) {
            throw new Error("Invalid membership request ID")
        }

        const id = new ObjectId(membership_request_id)

        amount = Number(amount);

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
                membership_request_id,
                givenNames: updater.first_name,
                surname: updater.last_name,
                email: updater.email
            }
        }

        const response = await axiosInstance.post("/ewallets/charges", payload);


        /** const charge = await eWallet.createEWalletCharge({
            referenceID: external_id,
            currency: "PHP",
            amount: amount,
            checkoutMethod: "ONE_TIME_PAYMENT",
            channelCode: "PH_GCASH",
            channelProperties: {
                successRedirectURL: "https://localhost/3000/payment/success",
                failureRedirectURL: "https://localhost/3000/payment/failed"
            },
            customer
        }); */

        await PaymentModel.createPayment({
            provider: "xendit",
            external_id: external_id,
            amount: amount,
            status: "PENDING",
            membership_request_id: membership_request_id,
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
}

export default new PaymentService();