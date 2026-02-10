import express from "express";
import { authorizeRoles, verifyToken } from "../middleware/authmiddleware.js";
import MemberController from "../controllers/MemberController.js";

const router = express.Router();

router.patch('/member/postform', verifyToken, authorizeRoles("member"), MemberController.PostForm);
router.get('/member/alltrainers', verifyToken, authorizeRoles("member"), MemberController.listOfTrainersAfterPostForm);
router.patch('/member/assigning', verifyToken, authorizeRoles("member"), MemberController.selectTrainer);

export default router;