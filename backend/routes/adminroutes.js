import express from "express";
import { authorizeRoles, verifyToken } from "../middleware/authmiddleware.js";
import AdminController from "../controllers/AdminController.js";
import MemberManagementController from "../controllers/MemberManagementController.js";

const router = express.Router();

router.post(
    "/admin/plan", 
    verifyToken, 
    authorizeRoles("admin"), 
    AdminController.createPlansController
);

// Member Management API Route
router.post("/admin/members", verifyToken, authorizeRoles("admin"), MemberManagementController.createMember);
router.get("/admin/members", verifyToken, authorizeRoles("admin"), MemberManagementController.listMembers);
router.get("/admin/members/:id", verifyToken, authorizeRoles("admin"), MemberManagementController.viewMember)
router.put("/admin/members/:id", verifyToken, authorizeRoles("admin"), MemberManagementController.updateMemberProfile);
router.patch("/admin/members/:id", verifyToken, authorizeRoles("admin"), MemberManagementController.updateUserStatus);
router.post("/admin/members/:id/assign-trainer", verifyToken, authorizeRoles("admin"), MemberManagementController.assignATrainer);

// Plans API Route
router.post("/admin/plans", verifyToken, authorizeRoles("admin"), AdminController.createPlansController);
router.get("/admin/plans", verifyToken, authorizeRoles("admin"), AdminController.viewAllPlans);
router.get("/admin/plans/:id", verifyToken, authorizeRoles("admin"), AdminController.viewAPlan);
router.put("/admin/plans/:id", verifyToken, authorizeRoles("admin"), AdminController.updatePlan);
router.patch("/admin/plans/:id/status", verifyToken, authorizeRoles("admin"), AdminController.updatePlanStatus);

// Price API Route
router.post("/admin/pricing", verifyToken, authorizeRoles("admin"), AdminController.createPricingController);
router.get("/admin/pricing", verifyToken, authorizeRoles("admin"), AdminController.viewAllPricing);
router.get("/admin/pricing/:id", verifyToken, authorizeRoles("admin"), AdminController.viewOnePricing);
router.get("/admin/pricing/plan/:plan_id", verifyToken, authorizeRoles("admin"), AdminController.viewPricingByPlan);
router.put("/admin/pricing/:id", verifyToken, authorizeRoles("admin"), AdminController.updatePricing);
router.patch("/admin/pricing/:id/status", verifyToken, authorizeRoles("admin"), AdminController.updatePricingStatus);


export default router; 