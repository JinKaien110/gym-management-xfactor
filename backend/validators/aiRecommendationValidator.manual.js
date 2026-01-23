import { ObjectId } from "mongodb";
import { ValidationError } from "../errors/ValidationError.js";

export function validateAndNormalizeInputs(body) {
     let { 
        member_id, 
        experience_level, 
        days_per_week, 
        session_minutes, 
        gender, 
        date_of_birth, 
        height, weight, 
        bmi, 
        fitness_goal, 
        training_type, 
        medical_condition, 
        notes } = body 

        if(!member_id || !ObjectId.isValid(member_id)) {
            throw new ValidationError("Invalid member ID")
        }

        if(experience_level === undefined || experience_level === null || String(experience_level).trim() === "") {
            throw new ValidationError("Experience level is required")
        }

        if(days_per_week === undefined || days_per_week === null || days_per_week === "") {
            throw new ValidationError("Day per week is required")
        }

        if(session_minutes === undefined || session_minutes === null || session_minutes === "") {
            throw new ValidationError("Session minutes is required")
        }

        if(fitness_goal === undefined || fitness_goal === null || (Array.isArray(fitness_goal) ? fitness_goal.length === 0 : String(fitness_goal).trim() === "")) {
            throw new ValidationError("Fitness goal is required")
        }

        const dpw = Number(days_per_week);
        const mins = Number(session_minutes);

        if(!Number.isInteger(dpw) || dpw < 1 || dpw > 7) {
            throw new ValidationError("Days per week must be 1-7")
        }

        if(!Number.isFinite(mins) || mins < 15 || mins > 240) {
            throw new ValidationError("Duration of training must be only 15 mins to 240 mins")
        }

        const goals = Array.isArray(fitness_goal) 
        ? fitness_goal.map(f => String(f).trim().toLowerCase()).filter(Boolean) 
        : [String(fitness_goal).trim().toLowerCase()];
        
        const trainingType = training_type ? String(training_type).trim().toLowerCase() : "resistanace"

        const medicalConditions = medical_condition 
        ? (Array.isArray(medical_condition) ? medical_condition.map(m => String(m).trim().toLowerCase()) : [String(medical_condition).trim().toLowerCase()]) : [];

        let age = null;
        if(date_of_birth) {
            const dob = new Date(date_of_birth);
            if(Number.isNaN(dob.getTime())) {
                throw new ValidationError("Invalid date of birth format");
            }
            age = Math.floor((Date.now() - dob.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
        }

        const heightCm = height ? Number(height) : null;
        const weightKg = weight ? Number(weight) : null;
        const bmiVal = bmi ? Number(bmi) : null;

        if(heightCm !== null && heightCm <= 0) {
            throw new ValidationError("Invalid height")
        } 

        if(weightKg !== null && weightKg <= 0) {
            throw new ValidationError("Invalid weight")
        } 

        if(bmiVal !== null && bmiVal <= 0) {
            throw new ValidationError("Invalid BMI")
        }
        
        return {
            member_id: new ObjectId(member_id),
            input: {
                goals: goals,
                experience_level: String(experience_level).toLowerCase(),
                days_per_week: dpw,
                session_minutes: mins,
                training_type: trainingType,
                limitations: medicalConditions,
                personal_profile: {
                    age,
                    gender: gender ? String(gender).toLowerCase() : "male",
                    height_cm: heightCm,
                    weight_kg: weightKg,
                    bmi: bmiVal
                },
                notes: notes ? String(notes).trim() : ""
            }
        }
} 