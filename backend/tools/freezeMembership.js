async function freezemembership(membershipId, freeze_start, freeze_end, updater) {
    const db = await connectDB();
    const membership = await db.collection("memberships").findOne({ _id: membershipId });

    if (!membership) throw new Error("membership not found");

    const freezeDuration = freeze_end.getTime() - freeze_start.getTime();

    const update = {
        is_frozen: true,
        freeze_start,
        freeze_end,
        end_date: new Date(membership.end_date.getTime() + freezeDuration),
        updatedAt: new Date(),
        updatedBy: new ObjectId(updater)
    };

    const result = await db.collection("memberships").findOneAndUpdate(
        { _id: membershipId },
        { $set: update },
        { returnDocument: "after" }
    );

    return result;
}


/** 
 * {
  start_date: Date,
  end_date: Date,
  status: "active" | "cancelled" | "archived", // keep main status
  freeze_start: Date | null,
  freeze_end: Date | null,
  is_frozen: Boolean
}

 * 
 * 
 * const freezeDuration = (freeze_end.getTime() - freeze_start.getTime());
membership.end_date = new Date(membership.end_date.getTime() + freezeDuration);
membership.is_frozen = true;
membership.freeze_start = freeze_start;
membership.freeze_end = freeze_end;

 */