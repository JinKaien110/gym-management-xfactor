import express from "express";
import PaymentController from "../controllers/PaymentController.js";
import { authorizeRoles, verifyToken, authorizeUserTypes } from "../middleware/authmiddleware.js";
import { verifyXenditWebhook } from "../middleware/verifyXenditWebhook.js";

const router = express.Router();

router.post("/payments/create", verifyToken, authorizeUserTypes("admin", "client"), authorizeRoles("admin", "staff", "client"), PaymentController.createmembershipPayment);

router.post("/webhooks/xendit", verifyXenditWebhook, PaymentController.xenditWebhook);

router.get("/payments", verifyToken, authorizeUserTypes("admin"), authorizeRoles("admin", "staff", "superadmin"), PaymentController.getAllPayment);

router.get("/admin/payments/total-revenue", verifyToken, authorizeUserTypes("admin"), authorizeRoles("admin", "staff", "superadmin"), PaymentController.getTotalRevenue);

router.get("/client/payments", verifyToken, authorizeUserTypes("client"), authorizeRoles("client"), PaymentController.getAllMyPayments);

router.get("/payments/:id/receipt", verifyToken, authorizeUserTypes("admin", "client"), authorizeRoles("admin", "staff", "client"), PaymentController.receiptTemplate);

router.get("/client/payments/:id/receipt", verifyToken, authorizeUserTypes("client"), authorizeRoles("client"), PaymentController.receiptTemplate);

export default router;