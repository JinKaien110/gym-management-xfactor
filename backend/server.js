import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import { connectDB } from "./config/db.js";

import AuthRoutes from "./routes/authroutes.js";
import MemberRoutes from "./routes/memberroutes.js";
import PlanRoutes from "./routes/planroute.js";
import PricingRoutes from "./routes/pricingroutes.js";
import TrainerRoutes from "./routes/trainerroutes.js";
import MembershipRoutes from "./routes/membershiproutes.js";
import PaymentRoutes from "./routes/paymentroutes.js";
import AIRoutes from "./routes/airoutes.js";
import ClassRoutes from "./routes/classroutes.js";
import ClassScheduleRoutes from "./routes/classscheduleroutes.js";
import BookingRoutes from "./routes/bookingroutes.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { auditMeta } from "./middleware/auditMeta.js";

dotenv.config();
const app = express();

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));

app.use(express.json());
app.use(cookieParser());
app.use(auditMeta)

app.use('/api', AuthRoutes);
app.use('/api',  MemberRoutes);
app.use('/api',  PlanRoutes);
app.use('/api',  PricingRoutes);
app.use('/api', TrainerRoutes);
app.use('/api', MembershipRoutes);
app.use('/api', PaymentRoutes);
app.use('/api', AIRoutes);
app.use('/api', ClassRoutes);
app.use('/api', ClassScheduleRoutes);
app.use('/api', BookingRoutes);


app.use(errorHandler)


const PORT = process.env.PORT || 3000;

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running at http://localhost:${PORT}`);
    });
});
