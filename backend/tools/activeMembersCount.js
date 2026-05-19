// Pseudocode for checking if a trainer can take a new client
const activeclientsCount = await db.collection("clients").countDocuments({
    trainer_id: trainer._id,
    status: "active"
});

if (activeclientsCount >= trainer.max_clients) {
    throw new Error("Trainer has reached maximum active clients");
}


/** const start_date = body.start_date ? new Date(body.start_date) : new Date();
        const end_date = new Date(
            start_date.getTime() + pricing.duration_days * 24 * 60 * 60 * 1000
        );

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const sd = new Date(start_date);
        sd.setHours(0, 0, 0, 0);

        if(user.role === "staff" && sd < today) {
            throw new Error("Staff cannot backdate membership");
        }

        if(Number.isNaN(start_date.getTime())) {
            throw new Error("Invalid start date format");
        }

        if(Number.isNaN(end_date.getTime())) {
            throw new Error("Invalid end date format");
        }

        if(end_date <= start_date) {
            throw new Error("End date must be after start date");
        }

        const active = await MembershipModel.alreadyHavemembership(new ObjectId(client_id));

        if(active) throw new Error("User already have an active membership")
            
        const sanitized = {
            client_id: new ObjectId(client_id),
            plan_id: new ObjectId(plan_id),
            pricing_id: new ObjectId(pricing_id),
            start_date: start_date,
            end_date: end_date,
            status: "active",
            createdAt: new Date(),
            createdBy: new ObjectId(creator),
            updatedAt: new Date(),
            updatedBy: new ObjectId(creator),
            is_frozen: false,
            frozenAt: null,
            frozenBy: null,
            unfrozenAt: null,
            archivedAt: null,
            archivedBy: null
        } */