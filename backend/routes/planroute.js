import express from "express";
import PlanController from "../controllers/PlanController.js";
import { authorizeRoles, verifyToken } from "../middleware/authmiddleware.js";
const router = express.Router();

router.post("/plans", verifyToken, authorizeRoles("admin", "staff"), PlanController.createPlans);
router.get("/plans", verifyToken, authorizeRoles("admin", "staff"), PlanController.viewAllPlans);
router.get("/plans/:id", verifyToken, authorizeRoles("admin", "staff"), PlanController.viewAPlan);
router.patch("/plans/:id", verifyToken, authorizeRoles("admin", "staff"), PlanController.updatePlan);
router.patch("/plans/:id/status", verifyToken, authorizeRoles("admin", "staff"), PlanController.updatePlanStatus);


export default router;