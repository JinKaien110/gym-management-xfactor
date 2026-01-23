import { ObjectId } from "mongodb";
import { ValidationError } from "../errors/ValidationError.js";
import AIRecommendationModel from "../models/AIRecommendationModel.js";
import { validateAndNormalizeInputs } from "../validators/aiRecommendationValidator.manual.js";
import dotenv from "dotenv"
import { WorkoutRecommendationSchema } from "../validators/workoutRecommendation.schema.js";
import AuditLogsService from "./audit.logs.service.js";
import { genAI } from "../config/gemini.js";
import MemberModel from "../models/MemberModel.js";

dotenv.config()


class AIRecommendationService {
    async requestRecommendation(body, updater, meta) {
        if (!updater?.id || !ObjectId.isValid(updater.id)) {
            throw new ValidationError("Invalid trainer ID");
        }

        if (updater.role !== "trainer") {
            throw new ValidationError("Only a trainer can request for recommendation");
        }

        if (!body?.member_id || !ObjectId.isValid(body.member_id)) {
            throw new ValidationError("Invalid member ID");
        }

        const trainerId = new ObjectId(updater.id);
        const memberId = new ObjectId(body.member_id);
        const notes = body?.notes ? String(body.notes).trim() : null;

        const actor = { id: trainerId, role: updater.role };

        return await auditWrap({
            action: "AI_RECOMMENDATION_REQUEST",
            entity: "workout_recommendations",
            actor,
            meta,
            summary: `Trainer requested AI recommendation for member ${String(memberId)}`,
            changes: { patch: { notes } },

            fn: async () => {
            const member = await MemberModel.FindUserById(memberId);
            if (!member) throw new ValidationError("No member found");

            if (!member.trainer_id || String(member.trainer_id) !== String(trainerId)) {
                throw new ValidationError("You cannot request a recommendation for a member not assigned to you");
            }

            const memberData = {
                goals: Array.isArray(member.fitness_goal)
                ? member.fitness_goal
                : (member.fitness_goal ? [member.fitness_goal] : []),
                experience_level: member.experience_level,
                days_per_week: member.days_per_week,
                session_minutes: member.session_minutes,
                training_type: member.training_type,
                personal_profile: {
                gender: member.gender,
                date_of_birth: member.date_of_birth,
                height: member.height,
                weight: member.weight,
                bmi: member.bmi,
                },
                limitations: member.medical_condition
                ? (Array.isArray(member.medical_condition) ? member.medical_condition : [member.medical_condition])
                : [],
                notes,
            };

            const model = genAI.getGenerativeModel({
                model: "models/gemini-2.5-flash",
                generationConfig: { temperature: 0.2, topP: 0.9 },
            });

            const prompt = `... ${JSON.stringify(memberData)} ...`; // keep your prompt

            const result = await model.generateContent(prompt);
            const raw = (await Promise.resolve(result.response.text())).trim();

            let json;
            try {
                json = JSON.parse(raw);
            } catch {
                const start = raw.indexOf("{");
                const end = raw.lastIndexOf("}");
                if (start !== -1 && end !== -1 && end > start) json = JSON.parse(raw.slice(start, end + 1));
                else throw new ValidationError("AI Returned invalid JSON");
            }

            const parsed = WorkoutRecommendationSchema.safeParse(json);
            if (!parsed.success) throw new ValidationError("AI output failed schema validation");

            const doc = {
                parent_id: null,
                version: 1,
                member_id: memberId,
                trainer_id: trainerId,
                input: memberData,
                recommendation: parsed.data,
                status: "pending",
                trainer_decision: { decision: null, comment: null, decidedAt: null, decidedBy: null },
                createdAt: new Date(),
                createdBy: trainerId,
                updatedAt: null,
                updatedBy: null,
            };


            return await AIRecommendationModel.requestRecommendation(doc);
            },
        });
    }


    async decisionRecommendationByTrainer(id, body, updater) {
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

        return await AIRecommendationModel.decisionRecommendationByTrainer(
            new ObjectId(id),
            data
        )
    }

    async regenerateRecommendation(id, body, updater) {
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

        const memberId = new ObjectId(recommendationParent.member_id);

        const member = await MemberModel.FindUserById(memberId)
        if(!member) {
            throw new ValidationError("No member found")
        }

        if(!member.trainer_id || String(member.trainer_id) !== String(trainerId)) {
            throw new ValidationError("Member is not assigned to you")
        }

        const memberData = {
            goals: Array.isArray(member.fitness_goal)
            ? member.fitness_goal
            : (member.fitness_goal ? [member.fitness_goal] : []),

            experience_level: member.experience_level,
            days_per_week: member.days_per_week,
            session_minutes: member.session_minutes,
            training_type: member.training_type,

            personal_profile: {
            gender: member.gender,
            date_of_birth: member.date_of_birth,
            height: member.height,
            weight: member.weight,
            bmi: member.bmi,
            },

            limitations: member.medical_condition
            ? (Array.isArray(member.medical_condition) ? member.medical_condition : [member.medical_condition])
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
        ${JSON.stringify(memberData)}
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

            member_id: memberId,
            trainer_id: trainerId,

            input: memberData,
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

        return await AIRecommendationModel.requestRecommendation(newDoc)
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

    async getMemberWorkoutNotes(req, res, next) {
        
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
        let { status, member_id, trainer_id, page = 1, limit = 10 } = query;

        let filter = {}
        if(status) {
            filter.status = status?.trim().toLowerCase()
        }

        if(member_id) {
            if(!ObjectId.isValid(member_id)) {
                throw new ValidationError("Invalid member ID")
            }
            filter.member_id = new ObjectId(member_id)
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
