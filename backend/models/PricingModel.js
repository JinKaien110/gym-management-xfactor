import { ObjectId } from "mongodb";
import { connectDB } from "../config/db.js";

class PricingModel {
    async getPricing(id) {
        const db = await connectDB();

        const result = await db.collection("pricing").findOne({ _id: id });

        return result;
    }
}

export default new PricingModel();