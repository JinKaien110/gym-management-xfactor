import dotenv from "dotenv";
import { debuggerLog } from "../utils/debuggerLog.js";
import MemberModel from "../models/MemberModel.js";

dotenv.config();

class MemberController {

    async PostForm(req, res) {
        try {
            const { gender, date_of_birth, height, weight, bmi, fitness_goal, medical_condition } = req.body;
            const userId = req.user.id;

            if(!gender, !date_of_birth, !height, !weight, !bmi, !fitness_goal) {
                return res.status(401).json({ message: "Please fillout the necessary fields!"});
            }

            const dob = new Date(date_of_birth);

            if(isNaN(dob.getTime())) {
                return res.status(400).json({ message: "Invalid date format for DOB" });
            }

            const today = new Date();
            if(dob > today) {
                return res.status(400).json({ message: "DOB cannot be in the future" });
            }

            const ageDiff = today.getFullYear() - dob.getFullYear();
            if(ageDiff < 12 || ageDiff > 100) {
                return res.status(400).json({ message: "Unrealistic Age"});
            }

            if(!Array.isArray(fitness_goal)) {
                return res.status(400).json({ message: "Fitness goals must be an array" });
            }

            const sanitized = {
                gender: gender.trim().toLowerCase(),
                date_of_birth: dob,
                height: Number(height),
                weight: Number(weight),
                bmi: Number(bmi.toFixed(1)),
                fitness_goal: Array.isArray(fitness_goal)
                    ? fitness_goal.map(f => f.trim().toLowerCase())
                    : [fitness_goal.trim().toLowerCase()],
                medical_condition: medical_condition?.trim(),
                qr_code: null,
                updatedAt: new Date()
            }

            

            const UpdateMemberDetails = await MemberModel.PostForm(sanitized, userId);

            if(!UpdateMemberDetails) {
                debuggerLog("Post Form Controller", UpdateMemberDetails);
                return res.status(401).json({ message: UpdateMemberDetails});
            }

            res.status(200).json({ message: "Successfully updated member record!"});

        } catch (error) {
            debuggerLog("Post Form Controller", error);
            return res.status(500).json({ message: "Server Error"});
        }
    } 

    async allTrainers(req, res) {
        try {
            const user = await MemberModel.FindUserById(req.user.id);
            const availability = await MemberModel.getAvailableTrainers(user.fitness_goal);

            res.status(200).json(availability);

        } catch {
            debuggerLog("allTrainers Controller", error);
            return res.status(500).json({ message: "Server Error"});
        }
    }

    async assignedTrainers(req, res) {
        try {
            const { trainer_id } = req.body;
            const userId = req.user.id;

            const assigning = await MemberModel.assignedTrainer(userId, trainer_id);
            
            res.status(200).json({ message: "You have now a trainer", assigning });
        } catch (error) {
            debuggerLog("assignedTrainers Controller", error);
            return res.status(500).json({ message: "Server Error"});
        }
    }
}

export default new MemberController();
