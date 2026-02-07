import express from "express";
import { authorizeRoles, verifyToken } from "../middleware/authmiddleware.js";
import AdminController from "../controllers/AdminController.js";
import MemberManagementController from "../controllers/MemberManagementController.js";

const router = express.Router();



// Member Management API Route
router.post("/admin/members", verifyToken, authorizeRoles("admin"), MemberManagementController.createMember);
router.get("/admin/members", verifyToken, authorizeRoles("admin"), MemberManagementController.listMembers);
router.get("/admin/members/:id", verifyToken, authorizeRoles("admin"), MemberManagementController.viewMember)
router.put("/admin/members/:id", verifyToken, authorizeRoles("admin"), MemberManagementController.updateMemberProfile);
router.patch("/admin/members/:id", verifyToken, authorizeRoles("admin"), MemberManagementController.updateUserStatus);
router.post("/admin/members/:id/assign-trainer", verifyToken, authorizeRoles("admin"), MemberManagementController.assignATrainer);

export default router; 