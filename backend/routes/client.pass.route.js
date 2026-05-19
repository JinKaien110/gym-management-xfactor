import express from "express";
import { authorizeRoles, verifyToken, authorizeUserTypes } from "../middleware/authmiddleware.js";
import ClientPassController from "../controllers/ClientPassController.js";

const router = express.Router();
import ClientPassController from "../controllers/ClientPassController.js";

router.post('/client/pass', verifyToken, authorizeUserTypes("client"), authorizeRoles("client"), ClientPassController.createclientPass);

router.patch('/client/pass/:id/status', verifyToken, authorizeUserTypes("admin"), authorizeRoles("admin", "staff"), ClientPassController.status);

router.get('/client/pass', verifyToken, authorizeUserTypes("client"), authorizeRoles("client"), ClientPassController.findclientPass);

router.get('/client/pass/active', verifyToken, authorizeUserTypes("client"), authorizeRoles("client"), ClientPassController.findActiveclientPass);

router.get('/client/passes', verifyToken, authorizeUserTypes("admin"), authorizeRoles("admin", "staff"), ClientPassController.findAllclientPass);

export default router;