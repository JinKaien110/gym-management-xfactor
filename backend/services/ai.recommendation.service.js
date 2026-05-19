import { ObjectId } from "mongodb";
import { ValidationError } from "../errors/ValidationError.js";
import AIRecommendationModel from "../models/AIRecommendationModel.js";
import { validateAndNormalizeInputs } from "../validators/aiRecommendationValidator.manual.js";
import dotenv from "dotenv"
import { WorkoutRecommendationSchema } from "../validators/workoutRecommendation.schema.js";
import AuditLogsService from "./audit.logs.service.js";
import { genAI } from "../config/gemini.js";
import ClientModel from "../models/ClientModel.js";
import generateWithFallback from "../utils/getWorkingModel.js";

dotenv.config()


class AIRecommendationService {
    async requestBusinessRecommendation(meta, body, updater) {
    if (!updater?.id || !ObjectId.isValid(updater.id)) {
        throw new ValidationError("Invalid user ID");
    }

    let { range, start_date, end_date } = body;
    range = range ? String(range).trim().toLowerCase() : "1_month";

    const allowedRanges = ["1_month", "3_months", "6_months"];
    if(!allowedRanges.includes(range)) {
        throw new ValidationError("Invalid range value");
    }

    const data = await AIRecommendationModel.fetchAllData({ range, start_date, end_date });
    
    return await AuditLogsService.auditWrap({
        action: "AI_BUSINESS_RECOMMENDATION_REQUEST",
        entity: "business_recommendations",
        actor: { id: new ObjectId(updater.id), role: updater.role, user_type: updater.user_type },
        meta: meta,
        summary: `${updater.first_name} ${updater.last_name} requested a business recommendation analysis`,

        fn: async () => {

            // 🔥 STEP 1: FALLBACK


            // 🔥 STEP 2: AI MODEL


            // 🔥 STEP 3: STRONG PROMPT (THIS IS THE IMPORTANT PART)
            const prompt = `
            You are a senior business analyst specializing in the fitness and gym industry.

            Your task is to analyze the provided business data and generate:
            1. A detailed analysis of the current business performance
            2. Key insights and patterns
            3. Strategic recommendations based on proven industry practices

            IMPORTANT:
            - Use real-world gym business strategies such as:
            • pricing optimization
            • membership retention strategies
            • upselling and cross-selling
            • trainer utilization optimization
            • scheduling optimization
            • promotional campaigns
            - Compare trends and identify weak vs strong areas
            - Avoid generic advice — be specific and actionable
            - Recommendations must be practical and realistic

            OUTPUT FORMAT (STRICT JSON):
            {
            "analysis": {
                "summary": "...",

                "highlights": [
                {
                    "title": "Revenue Growth",
                    "description": "...",
                    "type": "positive"
                },
                {
                    "title": "High Pending Payments",
                    "description": "...",
                    "type": "warning"
                }
                ],

                "metrics": [
                {
                    "label": "Revenue Growth",
                    "value": "+15%",
                    "trend": "up"
                },
                {
                    "label": "Conversion Rate",
                    "value": "68%",
                    "trend": "down"
                }
                ],

                "risks": [
                {
                    "title": "Low Conversion Rate",
                    "severity": "high",
                    "description": "..."
                }
                ]
            },

            "recommendations": [
                {
                "title": "Introduce Off-Peak Discounts",
                "description": "...",
                "impact": "high",
                "category": "revenue",
                "priority_score": 9
                }
            ]
            }

            BUSINESS DATA:
            ${JSON.stringify(data, null, 2)}
            `;

            const result = await generateWithFallback(genAI, prompt);
            const raw = (await Promise.resolve(result.response.text())).trim();

            let json;
            try {
                json = JSON.parse(raw);
            } catch {
                const start = raw.indexOf("{");
                const end = raw.lastIndexOf("}");
                if (start !== -1 && end !== -1 && end > start) {
                    json = JSON.parse(raw.slice(start, end + 1));
                } else {
                    throw new ValidationError("AI returned invalid JSON");
                }
            }

            // 🔥 STEP 4: SAVE USING YOUR SCHEMA
            const doc = {
                generated_by: new ObjectId(updater.id),
                type: body?.type || "monthly",
                start_date: body?.start_date || null,
                end_date: body?.end_date || null,
                input_data: data,
                analysis: json.analysis,
                recommendations: json.recommendations,
                status: "generated",
                createdAt: new Date(),
            };

            return await AIRecommendationModel.requestRecommendation(doc);
        },
    });
}


    async decisionRecommendationByTrainer(id, meta, body, updater) {
        if(!id || !ObjectId.isValid(id)) {
            throw new ValidationError("Invalid recommendations ID");
        }

        if(!updater.id || !ObjectId.isValid(updater.id)) {
            throw new ValidationError("Invalid trainer ID");
        }

        if(updater.role !== "trainer") {
            throw new ValidationError("Trainer should only decide")
        }

        const status = body.status ? String(body.status).trim().toLowerCase() : null;

        if(!status) {
            throw new ValidationError("No status value")
        }

        const allowedStatus = ["approved", "rejected"];
        if(!allowedStatus.includes(status)) {
            throw new ValidationError("Invalid status value")
        }
        
        const recommendationId = new ObjectId(id)
        const trainerId = new ObjectId(updater.id)

        const existing = await AIRecommendationModel.findById(recommendationId)
        if(!existing) {
            throw new ValidationError("Recommendation does not exist")
        }

        if(!existing.trainer_id || String(existing.trainer_id) !== String(trainerId)) {
            throw new ValidationError("You are not allowed to decide this recommendation")
        }

        if(existing.status !== "pending") {
            throw new ValidationError(`Cannot decide a recommendation with status: ${existing.status}`)
        }

        const data = {
            status,
            trainer_decision: {
            decision: status,
            comment: body?.comment ? String(body.comment).trim() : null,
            decidedAt: new Date(),
            decidedBy: trainerId,
            },
            updatedAt: new Date(),
            updatedBy: trainerId,
        };

        return await AuditLogsService.auditWrap({
            action: "AI_RECOMMENDATION_DECISION",
            entity: "business_recommendations",
            entity_id: new ObjectId(id),
            actor: { id: trainerId, role: 
                updater.role
              }, 
            meta: meta,
            summary: `${updater.first_name} ${updater.last_name} (${updater.role} → ${updater.user_type}) decided to ${status} the recommendation`,
            changes: {
                before: {
                    status: existing.status
                },
                after: {
                    status: status
                }
            },
            fn: async () => {
                return await AIRecommendationModel.decisionRecommendationByTrainer(
                    new ObjectId(id),
                    data
                )
            }
        });
        
    }

    async regenerateRecommendation(id, meta, body, updater) {
        if(!id || !ObjectId.isValid(id)) {
            throw new ValidationError("Invalid recommendation ID");
        }

        if(!updater.id || !ObjectId.isValid(updater.id)) {
            throw new ValidationError("Invalid trainer ID");
        }

        const notes = body.notes?.trim() || null
        const trainerId = new ObjectId(updater.id)
        const recommendationId = new ObjectId(id)

        const recommendationParent = await AIRecommendationModel.findById(new ObjectId(recommendationId))
        if(!recommendationParent) {
            throw new ValidationError("No recommendation parent found")
        }
        

        if(String(recommendationParent.trainer_id) !== String(trainerId)) {
            throw new ValidationError("Only trainer can request for a new recommendation")
        }

        const parentId = recommendationParent.parent_id ? new ObjectId(recommendationParent.parent_id) : recommendationId;

        const latest = await AIRecommendationModel.findLatestByParentId(parentId)

        const nextVersion = latest?.version ? Number(latest.version) + 1 : 2;

        const clientId = new ObjectId(recommendationParent.client_id);

        const client = await ClientModel.findUserById(clientId)
        if(!client) {
            throw new ValidationError("No client found")
        }

        if(!client.trainer_id || String(client.trainer_id) !== String(trainerId)) {
            throw new ValidationError("client is not assigned to you")
        }

        const clientData = {
            goals: Array.isArray(client.fitness_goal)
            ? client.fitness_goal
            : (client.fitness_goal ? [client.fitness_goal] : []),

            experience_level: client.experience_level,
            days_per_week: client.days_per_week,
            session_minutes: client.session_minutes,
            training_type: client.training_type,

            personal_profile: {
            gender: client.gender,
            date_of_birth: client.date_of_birth,
            height: client.height,
            weight: client.weight,
            bmi: client.bmi,
            },

            limitations: client.medical_condition
            ? (Array.isArray(client.medical_condition) ? client.medical_condition : [client.medical_condition])
            : [],

            notes,
        }

        const model = genAI.getGenerativeModel({
            model: "models/gemini-2.5-flash",
            generationConfig: {
                temperature: 0.2,
                topP: 0.9
            }
        });

        const prompt = `
        Return ONLY valid JSON.
        No markdown. No explanation.

        JSON schema:
        {
        "title": string,
        "summary": string,
        "weekly_plan": [
            {
            "day": string,
            "focus": string,
            "exercises": [
                { "name": string, "sets": number, "reps": string, "rest_sec": number, "notes": string }
            ],
            "warmup": string[],
            "cooldown": string[]
            }
        ],
        "progression": string,
        "safety_notes": string[],
        "estimated_difficulty": "easy" | "moderate" | "hard"
        }

        User input:
        ${JSON.stringify(clientData)}
        `.trim();

        const result = await model.generateContent(prompt)
        const raw = (await Promise.resolve(result.response.text())).trim();

        let json;
        try {
            json = JSON.parse(raw)
        } catch (e) {
            const start = raw.indexOf("{");
            const end = raw.lastIndexOf("}");
            if(start !== -1 && end !== -1 && end > start) {
                json = JSON.parse(raw.slice(start, end + 1));
            } else {
                throw new ValidationError("AI Returned invalid JSON");
            } 
        }

        const parsed = WorkoutRecommendationSchema.safeParse(json);
        if (!parsed.success) {
            throw new ValidationError("AI output failed schema validation");
        }

        const newDoc = {
            parent_id: parentId,
            version: nextVersion,

            client_id: clientId,
            trainer_id: trainerId,

            input: clientData,
            recommendation: parsed.data,

            status: "pending",
            trainer_decision: {
                decision: null,
                comment: null,
                decidedAt: null,
                decidedBy: null,
            },

            createdAt: new Date(),
            createdBy: trainerId,
            updatedAt: null,
            updatedBy: null,
        };

        
        return await AuditLogsService.auditWrap({
            action: "AI_RECOMMENDATION_REGENERATE",
            entity: "business_recommendations",
            actor: { id: trainerId, role: 
                updater.role, user_type: updater.user_type
              }, 
            meta: meta,
            summary: `${updater.first_name} ${updater.last_name} (${updater.role} → ${updater.user_type}) request for a new recommendation`,
            fn: async () => {
                return await AIRecommendationModel.requestRecommendation(newDoc)
            }
        });

        
    }

    async getRecommendationDetails(id) {
        if(!id || !ObjectId.isValid(id)) {
            throw new ValidationError("Invalid recommendation ID");
        }

        const recommendation = await AIRecommendationModel.findById(new ObjectId(id))

        if(!recommendation) {
            throw new ValidationError("No recommendation found");
        }

        return recommendation
    }

    async getclientWorkoutNotes(req, res, next) {
        
    }

    async listTrainerPendingRecommendations(query, trainer) {
        if(!trainer.id || !ObjectId.isValid(trainer.id)) {
            throw new ValidationError("Invalid trainer ID");
        }

        let { page = 1, limit = 10 } = query;
        Number(page)
        Number(limit)

        return await AIRecommendationModel.listTrainerPendingRecommendations(
            new ObjectId(trainer.id),
            page,
            limit
        )
    }

    async listAllRecommendations(query) {
        let { status, client_id, trainer_id, page = 1, limit = 10 } = query;

        let filter = {}
        if(status) {
            filter.status = status?.trim().toLowerCase()
        }

        if(client_id) {
            if(!ObjectId.isValid(client_id)) {
                throw new ValidationError("Invalid client ID")
            }
            filter.client_id = new ObjectId(client_id)
        }

        if(trainer_id) {
            if(!ObjectId.isValid(trainer_id)) {
                throw new ValidationError("Invalid trainer ID")
            }
            filter.trainer_id = new ObjectId(trainer_id)
        }

        page = Number(page) > 0 ? Number(page) : 1;
        limit = Number(limit) > 0 ? Number(limit) : 10;


        return await AIRecommendationModel.listAllRecommendations(filter, page, limit)
    }

    async getRecommendationChain(id) {
        if(!id || !ObjectId.isValid(id)) {
            throw new ValidationError("Invalid recommendation ID");
        }

        const recommendation = await AIRecommendationModel.findById(new ObjectId(id))
        if(!recommendation) {
            throw new ValidationError("No recommendation exist")
        }

        const chainId = recommendation.parent_id ? new ObjectId(recommendation.parent_id) : recommendation._id;


        return await AIRecommendationModel.getRecommendationChain(
            chainId
        ) 
    }
}

export default new AIRecommendationService();
