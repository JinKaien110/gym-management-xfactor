import express from "express";
import { authorizeRoles, verifyToken, authorizeUserTypes } from "../middleware/authmiddleware.js";
import AdminController from "../controllers/AdminController.js";
import { connectDB } from "../config/db.js";

const router = express.Router();

router.post("/admin", verifyToken, authorizeUserTypes("admin"), authorizeRoles("superadmin"), AdminController.createAdmin);
router.patch("/admin/password/:id", verifyToken, authorizeUserTypes("admin"), authorizeRoles("superadmin"), AdminController.updatePassword);


export default router; 