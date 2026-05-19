import express from "express";
import PlanController from "../controllers/PlanController.js";
import { authorizeRoles, verifyToken, authorizeUserTypes } from "../middleware/authmiddleware.js";
const router = express.Router();

// Public endpoint - no auth required
router.get("/public/plans", PlanController.viewAllPlans);

router.post("/plans", verifyToken, authorizeRoles("admin", "staff"), PlanController.createPlans);

router.get("/plans", verifyToken, authorizeUserTypes("admin"), authorizeRoles("admin", "staff", "superadmin"), PlanController.viewAllPlans);

router.get("/plans/:id", verifyToken, authorizeUserTypes("admin", "client"), authorizeRoles("admin", "staff", "client"), PlanController.viewAPlan);

router.patch("/plans/:id", verifyToken, authorizeRoles("admin", "staff"), PlanController.updatePlan);

router.patch("/plans/:id/status", verifyToken, authorizeRoles("admin", "staff"), PlanController.updatePlanStatus);


export default router;