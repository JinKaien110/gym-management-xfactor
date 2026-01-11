import express from "express";
import AuthController from "../controllers/AuthController.js";
import { authorizeRoles, verifyToken } from "../middleware/authmiddleware.js";
const router = express.Router();

router.post('/auth/login', AuthController.loginUser);
router.post('/register', AuthController.RegisterUser);
router.post('/auth/logout', AuthController.Logout);
router.get('/auth/me', verifyToken, AuthController.Me);

export default router;