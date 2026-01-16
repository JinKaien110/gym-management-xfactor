import { ObjectId } from "mongodb";
import { connectDB } from "../config/db.js";
import { ValidationError } from "../errors/ValidationError.js";

class AIRecommendationModel {
    async requestRecommendation(req, res, next) {

    }

    async decisionRecommendationByTrainer(req, res, next) {
        
    }

    async regenerateRecommendation(req, res, next) {
        
    }

    async getRecommendationDetails(req, res, next) {
        
    }

    async getMemberWorkoutNotes(req, res, next) {
        
    }

    async listTrainerPendingRecommendations(req, res, next) {
        
    }

    async listAllRecommendations(req, res, next) {
        
    }
}

export default new AIRecommendationModel();