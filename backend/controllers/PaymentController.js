import PaymentService from "../services/payment.service.js";
import { debuggerLog } from "../utils/debuggerLog.js";

class PaymentController {
    async createMembershipPayment(req, res) {
        try {

            const result = await PaymentService.createGcashPayment(req.body, req.user);

            return res.status(201).json({ message: "Gcash payment created", checkout_url: result.checkout_url});
        } catch (error) {
            debuggerLog("createMembershipPayment Controller" + error);
            return res.status(500).json({ message: "Server Error", error: error.message,  });
        }
    }

    async xenditWebhook(req, res) {
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
            return res.status(500).send("Webhook error");
        }
    }
}

export default new PaymentController();