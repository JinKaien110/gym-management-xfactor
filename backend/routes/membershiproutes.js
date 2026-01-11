import express from "express";
import { authorizeRoles, verifyToken } from "../middleware/authmiddleware.js";
import MembershipController from "../controllers/MembershipController.js";

const router = express.Router();

router.post("/membership", verifyToken, authorizeRoles("admin", "staff", "member"), MembershipController.createMembershipRequest);

export default router;