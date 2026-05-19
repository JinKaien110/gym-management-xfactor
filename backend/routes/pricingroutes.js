import express from "express";
import { authorizeRoles, verifyToken, authorizeUserTypes } from "../middleware/authmiddleware.js";
import PricingController from "../controllers/PricingController.js";

const router = express.Router();

// Public endpoint - no auth required
router.get("/public/pricing", PricingController.viewAllPricing);

router.post("/pricing", verifyToken, authorizeUserTypes("admin"),authorizeRoles("admin", "staff"), PricingController.createPricing);

router.get("/pricing", verifyToken, authorizeUserTypes("admin"), authorizeRoles("admin", "staff", "superadmin"), PricingController.viewAllPricing);

router.get("/pricing/:id", verifyToken, authorizeUserTypes("admin", "client"), authorizeRoles("admin", "staff", "client"), PricingController.viewOnePricing);

router.get("/pricing/plan/:id", verifyToken, authorizeUserTypes("admin", "client"), authorizeRoles("admin", "staff", "client"), PricingController.viewPricingByPlan);

router.patch("/pricing/:id", verifyToken, authorizeRoles("admin", "staff"), PricingController.updatePricing);

router.patch("/pricing/:id/status", verifyToken, authorizeRoles("admin", "staff"), PricingController.updatePricingStatus);


export default router;