import { ObjectId } from "mongodb";
import PricingModel from "../models/PricingModel.js";
import MembershipConfigModel from "../models/MembershipConfigModel.js";

export async function calculateEndDate(id) {
    // const days = await PricingModel.getPricing(new ObjectId(id));
    const config = await MembershipConfigModel.findActivemembershipConfigs(); 

    if(!config) {
        throw new Error("Failed to find active membership config");
    }

    const start_date = new Date();
    const end_date = new Date(start_date.getTime() + config.duration_days * 24 * 60 * 60 * 1000);
    
    return end_date;
}