import express from "express";
import { authorizeRoles, verifyToken, authorizeUserTypes } from "../middleware/authmiddleware.js";
import AIRecommendationController from "../controllers/AIRecommendationController.js";

const router = express.Router();

router.post("/ai/workout-recommendation", verifyToken, authorizeRoles("trainer", "client"), AIRecommendationController.requestRecommendation)
router.patch("/ai/decision/:id", verifyToken, authorizeRoles("trainer"), AIRecommendationController.decisionRecommendationByTrainer)
router.post("/ai/regenerate/:id", verifyToken, authorizeRoles("trainer"), AIRecommendationController.regenerateRecommendation)
router.get("/ai/recommendation-details/:id", verifyToken, authorizeUserTypes("admin", "trainer"), authorizeRoles("admin","trainer"), AIRecommendationController.getRecommendationDetails)
router.get("/ai/list-pending-recommendation/:id", verifyToken, authorizeRoles("trainer"), AIRecommendationController.listTrainerPendingRecommendations)
router.get("/ai/workout-recommendation", verifyToken, authorizeUserTypes("admin", "trainer"), authorizeRoles("admin","trainer"), AIRecommendationController.listAllRecommendations)
router.get("/ai/recommendation-chain/:id", verifyToken, authorizeRoles("trainer"), AIRecommendationController.getRecommendationChain)

router.post("/ai/business-recommendation", verifyToken, authorizeUserTypes("admin"), authorizeRoles("admin", "superadmin", "staff"), AIRecommendationController.requestBusinessRecommendation)

export default router; 