import express from "express";
import { authorizeRoles, verifyToken } from "../middleware/authmiddleware.js";
import PricingController from "../controllers/PricingController.js";

const router = express.Router();

router.post("/pricing", verifyToken, authorizeRoles("admin", "staff"), PricingController.createPricing);
router.get("/pricing", verifyToken, authorizeRoles("admin", "staff"), PricingController.viewAllPricing);
router.get("/pricing/:id", verifyToken, authorizeRoles("admin", "staff"), PricingController.viewOnePricing);
router.get("/pricing/plan/:id", verifyToken, authorizeRoles("admin", "staff"), PricingController.viewPricingByPlan);
router.patch("/pricing/:id", verifyToken, authorizeRoles("admin", "staff"), PricingController.updatePricing);
router.patch("/pricing/:id/status", verifyToken, authorizeRoles("admin", "staff"), PricingController.updatePricingStatus);


export default router;