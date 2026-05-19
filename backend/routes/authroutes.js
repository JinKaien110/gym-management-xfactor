import express from "express";
import AuthController from "../controllers/AuthController.js";
import { authorizeRoles, authorizeUserTypes, verifyToken } from "../middleware/authmiddleware.js";
const router = express.Router();

router.post('/auth/login', AuthController.loginUser);
router.post('/register', AuthController.RegisterUser);

router.post('/auth/logout', verifyToken, authorizeUserTypes("admin", "client", "trainer"), authorizeRoles("superadmin", "admin", "staff", "client", "trainer"), AuthController.Logout);

router.get('/auth/me', verifyToken, authorizeUserTypes("admin", "client", "trainer"), authorizeRoles("superadmin", "admin", "staff", "client", "trainer"), AuthController.Me);

router.get('/auth/ssot', verifyToken, authorizeUserTypes("client"), authorizeRoles("client"), AuthController.SingleSourceOfTruth);

export default router;