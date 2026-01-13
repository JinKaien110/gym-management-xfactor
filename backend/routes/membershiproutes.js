import express from "express";
import { authorizeRoles, verifyToken } from "../middleware/authmiddleware.js";
import MembershipController from "../controllers/MembershipController.js";

const router = express.Router();

router.post("/membership", verifyToken, authorizeRoles("admin", "staff", "member"), MembershipController.createMembershipRequest);
router.get("/membership/:id", verifyToken, authorizeRoles("admin", "staff", "member"), MembershipController.viewMembership);
router.get("/memberships", verifyToken, authorizeRoles("admin", "staff", "member"), MembershipController.viewAllMembership);
router.put("/membership/update-membership/:id", verifyToken, authorizeRoles("admin", "staff", "member"), MembershipController.updateMembership);
router.patch("/membership/update-status/:id", verifyToken, authorizeRoles("admin", "staff", "member"), MembershipController.updateMembershipStatus);
router.patch("/membership/freeze/:id", verifyToken, authorizeRoles("admin", "staff", "member"), MembershipController.freezeMembership);
router.patch("/membership/unfreeze/:id", verifyToken, authorizeRoles("admin", "staff", "member"), MembershipController.unfreezeMembership);

export default router;