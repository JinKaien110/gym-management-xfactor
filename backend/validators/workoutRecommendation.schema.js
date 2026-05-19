import { z } from "zod"

export const WorkoutRecommendationSchema = z.object({
    title: z.string(),
    summary: z.string(),
    weekly_plan: z.array(
        z.object({
            day: z.string(),
            focus: z.string(),
            exercises: z.array(
                z.object({
                    name: z.string(),
                    sets: z.coerce.number().int().positive(),
                    reps: z.string(),
                    rest_sec: z.coerce.number().int().nonnegative(),
                    notes: z.string().optional().default(""),
                })
            ),
            cooldown: z.array(z.string()),
            warmup: z.array(z.string())
        })
    ),
    progression: z.string(),
    safety_notes: z.array(z.string()),
    estimated_difficulty: z.enum(["easy", "moderate", "hard"])
})