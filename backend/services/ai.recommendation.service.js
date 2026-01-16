import { ObjectId } from "mongodb";
import { ValidationError } from "../errors/ValidationError.js";
import AIRecommendationModel from "../models/AIRecommendationModel.js";
import { validateAndNormalizeInputs } from "../validators/aiRecommendationValidator.manual.js";
import { zodTextFormat } from "openai/helpers/zod"
import dotenv from "dotenv"
import { WorkoutRecommendationSchema } from "../validators/workoutRecommendation.schema.js";

dotenv.config()


class AIRecommendationService {
    async requestRecommendation(body, updater) {
        if(!updater.id || !ObjectId.isValid(updater.id)) {
            throw new ValidationError("Invalid trainer ID")
        }

        if(updater.role !== "trainer") {
            throw new ValidationError("Only a trainer can request for recommendation");
        }

        const trainerId = new ObjectId(updater.id);

        const { member_id, input } = validateAndNormalizeInputs(body);

        const response = await openai.responses.parse({ 
            model: process.env.OPENAI_MODEL || "gpt-4o-mini",
            input: [
                { role: "system", content: 
                    "You are a fitness assistant. Create a safe, realistic workout plan. " + "Return ONLY the structured JSON that matches the required schema. " + 
                    "Do not provide medical diagnosis; if limitations exist, include modifications and safety notes."},
                { role: "user", content: JSON.stringify({ input }) }
            ],
            text: { format: zodTextFormat(WorkoutRecommendationSchema, "workout_recommendation")}
        });

        const recommendation = response.output_parsed;
        if(!recommendation) throw new ValidationError("Failed to generate recommendation");

        const data = {
            member_id,
            trainer_id: trainerId,
            input,
            recommendation,
            status: "pending",
            trainer_decision: {
                decision: null,
                comment: null,
                decidedAt: null,
                decidedBy: null
            },
            createdAt: new Date(),
            createdBy: trainerId,
            updatedAt: null,
            updatedBy: null
        }
        return await AIRecommendationModel.requestRecommendation(data)
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

export default new AIRecommendationService();
