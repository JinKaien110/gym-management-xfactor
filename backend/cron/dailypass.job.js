import cron from 'node-cron';
import ClientPassModel from '../models/ClientPassModel.js';
import { connectDB } from '../config/db.js';


cron.schedule('0 0 * * *', async () => {
    try {
        const { db } = await connectDB();
        
        const today = new Date();
        await db.collection("clients_pass").updateMany(
            { 
                end_date: { $lt: today },
                status: "active"
            },
            { $set: { status: "expired" } }
        );
        console.log("Daily Passes updated successfully");
        
    } catch (error) {
        console.error("Error updating daily passes: ", error);
    }
});