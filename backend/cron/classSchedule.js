import cron from 'node-cron';
import { connectDB } from '../config/db.js';


cron.schedule('0 0 * * *', async () => {
    try {
        const { db } = await connectDB();
        
        const today = new Date();
        await db.collection("class_schedule").updateMany(
            { 
                end_at: { $lt: today },
                status: "open"
            },
            { $set: { status: "closed" } }
        );
        console.log("Class schedules updated successfully");
        
    } catch (error) {
        console.error("Error updating class schedules: ", error);
    }
});