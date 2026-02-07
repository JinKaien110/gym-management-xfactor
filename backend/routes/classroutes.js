import express from "express";
import ClassController from "../controllers/ClassController.js";
import { authorizeRoles, verifyToken } from "../middleware/authmiddleware.js";
const router = express.Router();

router.post('/class', verifyToken, authorizeRoles("admin", "staff"), ClassController.createClass);
router.get('/class/:id', verifyToken, authorizeRoles("admin", "staff"), ClassController.viewClass);
router.get('/class', verifyToken, authorizeRoles("admin", "staff"), ClassController.viewAllClass);
router.put('/class/:id', verifyToken, authorizeRoles("admin", "staff"), ClassController.updateClass);
router.patch('/class/:id', verifyToken, authorizeRoles("admin", "staff"), ClassController.updateClassStatus);


export default router;