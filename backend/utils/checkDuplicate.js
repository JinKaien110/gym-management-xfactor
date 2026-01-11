import { connectDB } from "../config/db.js";
import { ObjectId } from "mongodb";

export default async function checkDuplicate(id, { email, phone}) {
    const db = await connectDB();
    const query = [];

    if(email) {
        query.push({ email, _id: { $ne: new ObjectId(id) } });
    }
    
    if(phone) {
        query.push({ phone, _id: { $ne: new ObjectId(id) } });
    }

    if(!query.length) return;

    const existing = await db.collection("members").findOne({
        $or: query
    });

    if(!existing) return;

    if(existing.email === email)
        throw new Error("Email is already in use by another member");

    if(existing.phone === phone)
        throw new Error("Phone number is already in use by another member");
}