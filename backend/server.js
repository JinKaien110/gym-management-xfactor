import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import { connectDB } from "./config/db.js";

import AuthRoutes from "./routes/authroutes.js";
import MemberRoutes from "./routes/memberroutes.js";
import AdminRoutes from "./routes/adminroutes.js";
import TrainerRoutes from "./routes/trainerroutes.js";
import MembershipRoutes from "./routes/membershiproutes.js";
import PaymentRoutes from "./routes/paymentroutes.js";

dotenv.config();
const app = express();

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));

app.use(express.json());
app.use(cookieParser());

app.use('/api', AuthRoutes);
app.use('/api',  MemberRoutes);
app.use('/api',  AdminRoutes);
app.use('/api', TrainerRoutes);
app.use('/api', MembershipRoutes);
app.use('/api', PaymentRoutes);

const PORT = process.env.PORT || 3000;

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running at http://localhost:${PORT}`);
    });
});
