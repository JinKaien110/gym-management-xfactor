import express from "express";
import { authorizeRoles, verifyToken, authorizeUserTypes } from "../middleware/authmiddleware.js";
import MemberController from "../controllers/MemberController.js";

const router = express.Router();

router.patch('/member/postform', verifyToken, authorizeUserTypes("member"), authorizeRoles("member"), MemberController.PostForm);
router.get('/member/alltrainers', verifyToken, authorizeUserTypes("member"),authorizeRoles("member"), MemberController.listOfTrainersAfterPostForm);
router.patch('/member/assigning', verifyToken, authorizeUserTypes("member"),  authorizeRoles("member"), MemberController.selectTrainer);

router.get('/admin/members', verifyToken, authorizeUserTypes("admin"), authorizeRoles("admin", "staff", "superadmin"), MemberController.listMembers);
router.post('/admin/members', verifyToken, authorizeUserTypes("admin"), authorizeRoles("admin", "staff", "superadmin"), MemberController.createMember);

// Member profile routes
router.get('/admin/members/:id', verifyToken, authorizeUserTypes("admin"), authorizeRoles("admin", "staff", "superadmin"), MemberController.viewMember);
router.patch('/admin/members/:id', verifyToken, authorizeUserTypes("admin"), authorizeRoles("admin", "staff", "superadmin"), MemberController.updateMemberProfile);
router.patch('/admin/members/:id/status', verifyToken, authorizeUserTypes("admin"), authorizeRoles("admin", "staff", "superadmin"), MemberController.updateUserStatus);

// QR Code route
router.get('/admin/members/:id/qrcode', verifyToken, authorizeUserTypes("admin"), authorizeRoles("admin", "staff", "superadmin"), MemberController.getMemberQrCode);

export default router;