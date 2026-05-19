// POST /api/payments/webhook
async function paymentWebhook(req, res) {
    try {
        const { cancel_request_id, status } = req.body; // data from payment gateway

        const cancelReq = await CancellationRequestModel.findById(cancel_request_id);
        if(!cancelReq || cancelReq.status !== "pending") {
            return res.status(400).json({ message: "Invalid request" });
        }

        if(status === "success") {
            // Mark request completed
            await CancellationRequestModel.update(cancel_request_id, {
                status: "completed",
                completed_at: new Date()
            });

            // Update membership
            await MembershipModel.updatemembership(cancelReq.membership_id, {
                status: "cancelled",
                updatedAt: new Date()
            });

            return res.json({ message: "membership cancelled successfully" });
        } else {
            await CancellationRequestModel.update(cancel_request_id, {
                status: "failed",
                completed_at: new Date()
            });
            return res.json({ message: "Payment failed" });
        }

    } catch(err) {
        console.error(err);
        res.status(500).json({ message: "Server Error" });
    }
}
