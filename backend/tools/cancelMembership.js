// POST /api/memberships/:id/cancel
async function cancelmembership(req, res) {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // 1. Check membership
        const membership = await MembershipModel.getmembership(id);
        if(!membership || membership.client_id.toString() !== userId) {
            return res.status(404).json({ message: "membership not found" });
        }

        // 2. Create cancellation request in DB
        const cancelReq = {
            membership_id: new ObjectId(id),
            client_id: new ObjectId(userId),
            status: "pending",
            amount: 5000, // cancellation fee
            requested_at: new Date(),
            createdBy: new ObjectId(userId)
        };

        const result = await CancellationRequestModel.create(cancelReq);

        // 3. Generate payment link/session
        const paymentLink = await PaymentGateway.createCheckout({
            amount: cancelReq.amount,
            currency: "PHP",
            metadata: { cancel_request_id: result._id.toString() } // key!
        });

        res.status(200).json({ paymentLink });
    } catch(err) {
        console.error(err);
        res.status(500).json({ message: "Server Error", error: err.message });
    }
}
