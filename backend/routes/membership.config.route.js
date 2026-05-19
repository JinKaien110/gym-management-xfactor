import express from "express";
import { authorizeRoles, verifyToken, authorizeUserTypes } from "../middleware/authmiddleware.js";
import MembershipConfigController from "../controllers/MembershipConfigController.js";

const router = express.Router();

router.post("/admin/membership-config", verifyToken, authorizeUserTypes("admin"), authorizeRoles("admin", "superadmin"), MembershipConfigController.create);

router.get("/client/membership-config", verifyToken, authorizeUserTypes("admin", "client"), authorizeRoles("admin", "client"), MembershipConfigController.showCurrentmembershipConfig);

router.patch("/admin/membership-config/edit/:id", verifyToken, authorizeUserTypes("admin"), authorizeRoles("admin", "superadmin"), MembershipConfigController.edit);

router.patch("/admin/membership-config/status/:id", verifyToken, authorizeUserTypes("admin"), authorizeRoles("admin", "superadmin"), MembershipConfigController.status);

export default router;
