import express from "express";
import AuthController from "../controllers/AuthController.js";
import { authorizeRoles, authorizeUserTypes, verifyToken } from "../middleware/authmiddleware.js";
const router = express.Router();

router.post('/auth/login', AuthController.loginUser);
router.post('/register', AuthController.RegisterUser);
router.post('/auth/logout', verifyToken, authorizeUserTypes("admin", "member"), authorizeRoles("superadmin", "admin", "staff", "member", "staff", "trainer"), AuthController.Logout);
router.get('/auth/me', verifyToken, authorizeUserTypes("admin", "member"), authorizeRoles("superadmin", "admin", "staff", "member", "staff"), AuthController.Me);
router.get('/auth/ssot', verifyToken, authorizeUserTypes("member"), authorizeRoles("member"), AuthController.SingleSourceOfTruth);

export default router;