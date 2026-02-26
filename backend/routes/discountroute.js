import express from "express";
import DiscountRequestController from "../controllers/DiscountRequestController.js";
import { authorizeRoles, verifyToken, authorizeUserTypes } from "../middleware/authmiddleware.js";
import { uploadDiscountFiles } from "../utils/uploads/discount.js";
const router = express.Router();

router.post("/discount-request", verifyToken, authorizeUserTypes("member"), authorizeRoles("member"), uploadDiscountFiles, DiscountRequestController.createDiscountRequest);
router.patch("/discount-request/:id/decision", verifyToken, authorizeUserTypes("admin"), authorizeRoles("admin", "staff"), DiscountRequestController.decisionOnDiscountRequest);

router.get("/discount-request/:id", verifyToken, authorizeUserTypes("admin", "member"), authorizeRoles("admin", "staff", "member"), DiscountRequestController.findDiscountRequestById);

router.get("/discount-requests", verifyToken, authorizeUserTypes("admin"), authorizeRoles("admin", "staff", 'superadmin'), DiscountRequestController.getAllDiscountRequests);



export default router; 