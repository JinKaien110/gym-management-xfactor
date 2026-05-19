import express from "express";
import { authorizeRoles, verifyToken, authorizeUserTypes } from "../middleware/authmiddleware.js";
import ClientController from "../controllers/ClientController.js";

const router = express.Router();

router.patch('/client/postform', verifyToken, authorizeUserTypes("client"), authorizeRoles("client"), ClientController.PostForm);

// Get client by ID (for profile)
router.get('/client/profile', verifyToken, authorizeUserTypes("client"), authorizeRoles("client"), ClientController.getclientProfile);

// Update client profile
router.patch('/client/profile', verifyToken, authorizeUserTypes("client"), authorizeRoles("client"), ClientController.updateclientProfileSelf);

router.patch('/clients/:id', verifyToken, authorizeUserTypes("admin"), authorizeRoles("admin", "staff", "superadmin"), ClientController.updateProfile);

router.get('/client/alltrainers', verifyToken, authorizeUserTypes("client"),authorizeRoles("client"), ClientController.listOfTrainersAfterPostForm);

router.patch('/client/assigning', verifyToken, authorizeUserTypes("client"),  authorizeRoles("client"), ClientController.selectTrainer);

router.get('/clients', verifyToken, authorizeUserTypes("admin"), authorizeRoles("admin", "staff", "superadmin"), ClientController.listclients);

router.post('/admin/clients', verifyToken, authorizeUserTypes("admin"), authorizeRoles("admin", "staff", "superadmin"), ClientController.createclient);

// client profile routes
router.get('/admin/clients/:id', verifyToken, authorizeUserTypes("admin"), authorizeRoles("admin", "staff", "superadmin"), ClientController.viewclient);

router.patch('/admin/clients/:id', verifyToken, authorizeUserTypes("admin"), authorizeRoles("admin", "staff", "superadmin"), ClientController.updateclientProfile);

router.patch('/admin/clients/:id/status', verifyToken, authorizeUserTypes("admin"), authorizeRoles("admin", "staff", "superadmin"), ClientController.updateUserStatus);

// QR Code route
router.get('/admin/clients/:id/qrcode', verifyToken, authorizeUserTypes("admin"), authorizeRoles("admin", "staff", "superadmin"), ClientController.getclientQrCode);

// Progress Log Routes
router.get('/client/progress', verifyToken, authorizeUserTypes("client"), authorizeRoles("client"), ClientController.getProgressLog);
router.post('/client/progress', verifyToken, authorizeUserTypes("client"), authorizeRoles("client"), ClientController.addProgressEntry);
router.put('/client/progress/:entryId', verifyToken, authorizeUserTypes("client"), authorizeRoles("client"), ClientController.updateProgressEntry);
router.delete('/client/progress/:entryId', verifyToken, authorizeUserTypes("client"), authorizeRoles("client"), ClientController.deleteProgressEntry);

export default router;