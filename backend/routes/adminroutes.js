import express from "express";
import { authorizeRoles, verifyToken } from "../middleware/authmiddleware.js";


const router = express.Router();


export default router; 