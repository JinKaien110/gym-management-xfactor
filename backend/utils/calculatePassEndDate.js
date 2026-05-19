import { ObjectId } from "mongodb";
import PricingModel from "../models/PricingModel.js";
import membershipconfigModel from "../models/membershipconfigModel.js";

export async function calculateEndDate(id) {
    const days = await PricingModel.getPricing(new ObjectId(id));
    

    if(!days) {
        throw new Error("Failed to find pricing");
    }

    const start_date = new Date();
    const end_date = new Date(start_date.getTime() + days.duration_days * 24 * 60 * 60 * 1000);
    
    return end_date;
}