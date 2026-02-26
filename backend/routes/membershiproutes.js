import express from "express";
import { authorizeRoles, verifyToken, authorizeUserTypes } from "../middleware/authmiddleware.js";
import MembershipController from "../controllers/MembershipController.js";

const router = express.Router();

router.post("/membership/request", verifyToken, authorizeUserTypes("admin", "member"), authorizeRoles("admin", "staff", "member"), MembershipController.createMembershipRequest);

// Admin routes for membership requests
router.post("/admin/membership-request", verifyToken, authorizeUserTypes("admin"), authorizeRoles("admin", "staff", "superadmin"), MembershipController.createMembershipRequest);

router.post("/membership/create/:id", verifyToken, authorizeUserTypes("admin", "member"), authorizeRoles("admin", "staff", "member"), MembershipController.createMembership);

router.get("/membership/:id", verifyToken, authorizeUserTypes("admin", "member"), authorizeRoles("admin", "staff", "member"), MembershipController.viewMembership);

router.get("/admin/memberships", verifyToken, authorizeUserTypes("admin"), authorizeRoles("admin", "staff", "superadmin"), MembershipController.viewAllMembership);

router.put("/membership/update-membership/:id", verifyToken, authorizeUserTypes("admin", "member"), authorizeRoles("admin", "staff", "member"), MembershipController.updateMembership);

router.patch("/membership/update-status/:id", verifyToken, authorizeUserTypes("admin", "member"), authorizeRoles("admin", "staff", "member"), MembershipController.updateMembershipStatus);

router.patch("/membership/freeze/:id", verifyToken, authorizeUserTypes("admin", "member"), authorizeRoles("admin", "staff", "member"), MembershipController.freezeMembership);

router.patch("/membership/unfreeze/:id", verifyToken, authorizeUserTypes("admin", "member"), authorizeRoles("admin", "staff", "member"), MembershipController.unfreezeMembership);

router.get("/membership-requests", verifyToken, authorizeUserTypes("admin"), authorizeRoles("admin", "staff", 'superadmin'), MembershipController.fetchAllMembershipRequests);

export default router;