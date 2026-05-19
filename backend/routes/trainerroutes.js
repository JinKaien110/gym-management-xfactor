import express from "express";
import { authorizeRoles, verifyToken, authorizeUserTypes } from "../middleware/authmiddleware.js";
import TrainerManagementController from "../controllers/TrainerManagementController.js";
import { uploadCertificationFiles } from "../utils/uploads/certificate.js";

const router = express.Router();

router.get("/trainers", verifyToken, authorizeUserTypes("admin", "client"), authorizeRoles("admin", "staff", "client"), TrainerManagementController.listTrainers);

router.get("/client/trainers", verifyToken, authorizeUserTypes("client"), authorizeRoles("client"), TrainerManagementController.listTrainers);

router.get("/public/trainers", TrainerManagementController.listPublicTrainers);

router.get("/trainers/:id", verifyToken, authorizeUserTypes("admin", "client", "trainer"), authorizeRoles("admin", "staff", "trainer", "client"), TrainerManagementController.getTrainer);

router.post("/trainers", verifyToken, authorizeRoles("admin"), TrainerManagementController.createTrainer);

router.patch("/trainers/:id", verifyToken, authorizeUserTypes("admin", "trainer"), authorizeRoles("admin", "staff", "trainer"), uploadCertificationFiles, TrainerManagementController.updateTrainerProfile);

router.patch("/trainers/:id", verifyToken, authorizeRoles("admin"), TrainerManagementController.updateTrainerStatus);

router.post("/trainers/:id", verifyToken, authorizeRoles("admin", "staff"), TrainerManagementController.assignclient);
router.patch("/trainers/:id/remove-client", verifyToken, authorizeRoles("admin"), TrainerManagementController.removeclient);
router.put("/trainer/profile/update", verifyToken, authorizeUserTypes("trainer"), uploadCertificationFiles, TrainerManagementController.updateOwnTrainerProfile);

export default router;