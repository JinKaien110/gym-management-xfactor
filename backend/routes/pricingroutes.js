import express from "express";
import { authorizeRoles, verifyToken, authorizeUserTypes } from "../middleware/authmiddleware.js";
import PricingController from "../controllers/PricingController.js";

const router = express.Router();

// Public endpoint - no auth required
router.get("/public/pricing", PricingController.viewAllPricing);

router.post("/pricing", verifyToken, authorizeRoles("admin", "staff"), PricingController.createPricing);
router.get("/pricing", verifyToken, authorizeUserTypes("admin"), authorizeRoles("admin", "staff", "superadmin"), PricingController.viewAllPricing);
router.get("/pricing/:id", verifyToken, authorizeRoles("admin", "staff"), PricingController.viewOnePricing);
router.get("/pricing/plan/:id", verifyToken, authorizeRoles("admin", "staff"), PricingController.viewPricingByPlan);
router.patch("/pricing/:id", verifyToken, authorizeRoles("admin", "staff"), PricingController.updatePricing);
router.patch("/pricing/:id/status", verifyToken, authorizeRoles("admin", "staff"), PricingController.updatePricingStatus);


export default router;