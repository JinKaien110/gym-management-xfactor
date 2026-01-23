import express from "express";
import { authorizeRoles, verifyToken } from "../middleware/authmiddleware.js";
import AIRecommendationController from "../controllers/AIRecommendationController.js";

const router = express.Router();

router.post("/ai/workout-recommendation", verifyToken, authorizeRoles("trainer"), AIRecommendationController.requestRecommendation)
router.patch("/ai/decision/:id", verifyToken, authorizeRoles("trainer"), AIRecommendationController.decisionRecommendationByTrainer)
router.post("/ai/regenerate/:id", verifyToken, authorizeRoles("trainer"), AIRecommendationController.regenerateRecommendation)
router.get("/ai/recommendation-details/:id", verifyToken, authorizeRoles("trainer"), AIRecommendationController.getRecommendationDetails)
router.get("/ai/list-pending-recommendation/:id", verifyToken, authorizeRoles("trainer"), AIRecommendationController.listTrainerPendingRecommendations)
router.get("/ai/workout-recommendation", verifyToken, authorizeRoles("trainer"), AIRecommendationController.listAllRecommendations)
router.get("/ai/recommendation-chain/:id", verifyToken, authorizeRoles("trainer"), AIRecommendationController.getRecommendationChain)

export default router; 