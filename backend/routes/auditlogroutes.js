import express from "express";
import { authorizeRoles, verifyToken, authorizeUserTypes } from "../middleware/authmiddleware.js";
import AuditLogController from "../controllers/AuditLogsController.js";

const router = express.Router();

router.get("/admin/audit-logs", verifyToken, authorizeUserTypes("admin"), authorizeRoles("admin", "staff", "superadmin"), AuditLogController.showAuditLogs);

router.get("/admin/audit-logs/:id", verifyToken, authorizeUserTypes("admin"), authorizeRoles("admin", "superadmin"), AuditLogController.viewOneAuditLog);

export default router;