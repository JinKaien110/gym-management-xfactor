import PaymentService from "../services/payment.service.js";
import { debuggerLog } from "../utils/debuggerLog.js";

class PaymentController {
    async createMembershipPayment(req, res, next) {
        try {

            let result;

            if(req.body.payment_method === "paymaya") {
                result = await PaymentService.createMayaPayment(req.body, req.user);
            } else if(req.body.payment_method === "gcash") {
                result = await PaymentService.createGcashPayment(req.body, req.user)
            } else if(req.body.payment_method === "cash") {
                throw new Error("Contact staff in the facility");
            } else {
                return res.status(400).json({ message: "Invalid payment"});
            }

            return res.status(201).json({ message: "Successfully payment created", checkout_url: result.checkout_url});
        } catch (error) {
            debuggerLog("createMembershipPayment Controller" + error.data);
            next(error)
        }
    }

    async xenditWebhook(req, res) {
        try {
            const event = req.body;
            console.log("Reference ID:", event.data.reference_id, typeof event.data.reference_id);

            
            if(event.event === "ewallet.capture" && event.data.status === "SUCCEEDED") {
                await PaymentService.markPaymentPaid(
                    event.data.reference_id,
                    event
                );
            }

            if(event.event === "payment.failed" || (event.event === "ewallet.capture" && event.data.status === "FAILED")) {
                await PaymentService.markPaymentFailed(
                    event.data.reference_id,
                    event
                );
            }

            return res.status(200).send("OK");
        } catch (error) {
            debuggerLog("Webhook Controller" + error.message);
            return res.status(500).send("Webhook error");
        }
    }

    async getAllPayment(req, res, next) {
        try {
            const result = await PaymentService.getAllPayment(req.query);

            return res.status(200).json(result);
        } catch (error) {
            debuggerLog("getAllPayment Controller" + error.message);
            next(error)
        }
    }

    async getPaymentDetails(req, res, next) {
        try {
            const result = await PaymentService.getPaymentDetails(req.params.id);

            return res.status(200).json(result);
        } catch (error) {
            debuggerLog("getAllPayment Controller" + error.message);
            next(error)
        }
    }
    
}

export default new PaymentController();