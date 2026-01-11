import express from "express";
import { authorizeRoles, verifyToken } from "../middleware/authmiddleware.js";
import TrainerManagementController from "../controllers/TrainerManagementController.js";

const router = express.Router();

router.get("/trainers", verifyToken, authorizeRoles("admin", "staff"), TrainerManagementController.listTrainers);
router.get("/trainers/:id", verifyToken, authorizeRoles("admin", "staff"), TrainerManagementController.getTrainer);
router.post("/trainers", verifyToken, authorizeRoles("admin"), TrainerManagementController.createTrainer);
router.put("/trainers/:id", verifyToken, authorizeRoles("admin", "staff"), TrainerManagementController.updateTrainerProfile);
router.patch("/trainers/:id", verifyToken, authorizeRoles("admin"), TrainerManagementController.updateTrainerStatus);
router.post("/trainers/:id", verifyToken, authorizeRoles("admin", "staff"), TrainerManagementController.assignMember);
router.patch("/trainers/:id/remove-member", verifyToken, authorizeRoles("admin"), TrainerManagementController.removeMember);

export default router;