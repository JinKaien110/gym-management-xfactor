import { ValidationError } from "../errors/ValidationError.js";
import MembershipService from "../services/membership.service.js";
import PaymentService from "../services/payment.service.js";
import { debuggerLog } from "../utils/debuggerLog.js";

class PaymentController {
    async createmembershipPayment(req, res, next) {
        try {

            let result;

            if(req.body.payment_method === "paymaya") {
                result = await PaymentService.createMayaPayment(req.auditMeta, req.body, req.user);
            } else if(req.body.payment_method === "gcash") {
                result = await PaymentService.createGcashPayment(req.auditMeta, req.body, req.user)
            } else if(req.body.payment_method === "cash") {
                throw new ValidationError("Contact staff in the facility");
            } else {
                throw new ValidationError("Invalid payment");
            }
            
            return res.status(201).json({ message: "Successfully payment created", checkout_url: result.checkout_url});
        } catch (error) {
            debuggerLog("createmembershipPayment Controller" + error.data);
            next(error)
        }
    }

    async xenditWebhook(req, res, next) {
        try {
            const event = req.body;

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
            next(error)
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

    async getAllMyPayments(req, res, next) {
        try {
            const result = await PaymentService.getAllMyPayments(req.query, req.user.id);
            
            return res.status(200).json(result);
        } catch (error) {
            debuggerLog("getAllMyPatments Controller" + error.message);
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

    async getTotalRevenue(req, res, next) {
        try {
            const result = await PaymentService.getTotalRevenue(req.query);

            return res.status(200).json(result);
        } catch (error) {
            debuggerLog("getTotalRevenue Controller" + error.message);
            next(error)
        }
    }
    
    async receiptTemplate(req, res, next) {
        try {
            await PaymentService.receiptTemplate(req.params.id, res);
        } catch (error) {
            debuggerLog("receiptTemplate Controller" + error.message);
            next(error);
        }  
    } 
}

export default new PaymentController();