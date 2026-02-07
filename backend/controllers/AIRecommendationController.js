import AIRecommendationService from "../services/ai.recommendation.service.js";
import { debuggerLog } from "../utils/debuggerLog.js";

class AIRecommendationController {
    async requestRecommendation(req, res, next) {
        try {
            const result = await AIRecommendationService.requestRecommendation(req.auditMeta, req.body, req.user)

            return res.status(201).json(result);
        } catch (error) {
            debuggerLog("Server Error: ", error)
            next(error)
        }
    }

    async decisionRecommendationByTrainer(req, res, next) {
        try {
            const result = await AIRecommendationService.decisionRecommendationByTrainer(req.params.id, req.auditMeta, req.body, req.user)

            const status = String(req.body.status).trim().toLowerCase();

            return res.status(200).json({ message: `Successfully ${status} the recommendation`});
        } catch (error) {
            debuggerLog("Server Error: ", error)
            next(error)
        }
    }

    async regenerateRecommendation(req, res, next) {
        try {
            const result = await AIRecommendationService.regenerateRecommendation(req.params.id, req.body, req.auditMeta, req.user)

            return res.status(200).json(result);
        } catch (error) {
            debuggerLog("Server Error: ", error)
            next(error)
        }
    }

    async getRecommendationDetails(req, res, next) {
        try {
            const result = await AIRecommendationService.getRecommendationDetails(req.params.id)

            return res.status(200).json(result);
        } catch (error) {
            debuggerLog("Server Error: ", error)
            next(error)
        }
    }

    async getMemberWorkoutNotes(req, res, next) {
        try {
            const result = await AIRecommendationService.getMemberWorkoutNotes(req.params.id)

            return res.status(200).json(result);
        } catch (error) {
            debuggerLog("Server Error: ", error)
            next(error)
        }
    }

    async listTrainerPendingRecommendations(req, res, next) {
        try {
            const result = await AIRecommendationService.listTrainerPendingRecommendations(req.query, req.user)

            return res.status(200).json(result);
        } catch (error) {
            debuggerLog("Server Error: ", error)
            next(error)
        }
    }

    async listAllRecommendations(req, res, next) {
        try {
            const result = await AIRecommendationService.listAllRecommendations(req.query)

            return res.status(200).json(result);
        } catch (error) {
            debuggerLog("Server Error: ", error)
            next(error)
        }
    }

    async getRecommendationChain(req, res, next) {
        try {
            const result = await AIRecommendationService.getRecommendationChain(req.params.id)

            return res.status(200).json(result);
        } catch (error) {
            debuggerLog("Server Error: ", error)
            next(error)
        }
    }
}

export default new AIRecommendationController();