export function normalizeRecommendation(obj) {
    if(!obj || typeof obj === "object") return obj

    for(const day of obj.weekly_plan ?? []) {
        if(typeof day.warmup === "number") day.warmup = [`${day.warmup} minutes light cardio`, "Dynamic stretches"]
        if(typeof day.cooldown === "number") day.cooldown = [`${day.cooldown} minutes stretching`, "Hydration"]
    }

    if(typeof obj.safety_notes === "string") obj.safety_notes = [obj.safety_notes];

    if(obj.progression && typeof obj.progression === "object") {
        obj.progression = "Progress weekly by adding small weight when reps feel easy; increase reps before weight; maintain good form.";
    }

    if(typeof obj.estimated_difficulty === "number") {
        obj.estimated_difficulty =
            obj.estimated_difficulty <= 3 ? "easy" :
            obj.estimated_difficulty <= 6 ? "moderate" : "hard";
    }

    return obj
}