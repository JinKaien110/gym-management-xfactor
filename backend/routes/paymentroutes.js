import express from "express";
import PaymentController from "../controllers/PaymentController.js";
import { authorizeRoles, verifyToken } from "../middleware/authmiddleware.js";
import { verifyXenditWebhook } from "../middleware/verifyXenditWebhook.js";

const router = express.Router();

router.post("/payments/gcash", verifyToken, authorizeRoles("admin", "staff", "member"), PaymentController.createMembershipPayment);

router.post("/webhooks/xendit", verifyXenditWebhook,PaymentController.xenditWebhook);

export default router;