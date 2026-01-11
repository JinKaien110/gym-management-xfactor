import { ObjectId } from "mongodb";
import dotenv from "dotenv";
import { debuggerLog } from "../utils/debuggerLog.js";
import TrainerManagementModel from "../models/TrainerManagementModel.js";
import checkDuplicate from "../utils/checkDuplicate.js";
import { hashedPassword } from "../utils/hashedPassword.js";
import TrainerService from "../services/trainer.service.js";

dotenv.config();

class TrainerManagementController {
    async createTrainer(req, res) {
        try {
            const result = await TrainerService.createTrainer(req.body, req.user);

            return res.status(201).json({ message: "Successfully added a new trainer", result });

        } catch (error) {
            debuggerLog("createTrainer Controller" + error.message);
            return res.status(500).json({ message: "Server Error", error: error.message });
        }
    }

    async listTrainers(req, res) {
        try {
            const result = await TrainerService.listTrainers(req.query);

            return res.status(200).json(result);
        } catch (error) {
            debuggerLog("listTrainers Controller" + error.message);
            return res.status(500).json({ message: "Server Error", error: error.message });
        }
    }

    async getTrainer(req, res) {
        try {
            const result = await TrainerService.getTrainer(req.params.id)

            return res.status(200).json(result);
        } catch (error) {
            if (error.message === "No trainer found") {
                return res.status(404).json({ message: error.message });
            }

            debuggerLog("getTrainer Controller" + error.message);
            return res.status(500).json({ message: "Server Error", error: error.message });
        }
    }

    async updateTrainerProfile(req, res) {
        try {
            const result = await TrainerService.updateTrainerProfile(req.params.id, req.body, req.user);
            
            return res.status(200).json({ message: "Successfully updated the trainer", result});
        } catch (error) {
            if (error.message === "Trainer not found") {
                return res.status(404).json({ message: error.message });
            }

            debuggerLog("getTrainer Controller" + error.message);
            return res.status(500).json({ message: "Server Error", error: error.message });
        }
    }

    async updateTrainerStatus(req, res) {
        try {
            const result = await TrainerService.updateTrainerStatus(req.params.id, req.body.status, req.user.id);

            return res.status(200).json({ message: "Successfully updated the trainer status", result});
        } catch (error) {
            if (error.message === "Trainer not found") {
                return res.status(404).json({ message: error.message });
            }

            debuggerLog("getTrainer Controller" + error.message);
            return res.status(500).json({ message: "Server Error", error: error.message });
        }
    }

    async assignMember(req, res) {
        try {
            const result = await TrainerService.assignMember(req.params.id, req.body, req.user.id);

            return res.status(200).json({ message: "Successfully added the member", result});
        } catch (error) {
            if (error.message === "Trainer not found") {
                return res.status(404).json({ message: error.message });
            }

            debuggerLog("assignMember Controller" + error.message);
            return res.status(500).json({ message: "Server Error", error: error.message });
        }
    }

    async removeMember(req, res) {
        try {
            const result = await TrainerService.removeMember(req.params.id, req.body, req.user);

            return res.status(200).json({ message: "Successfully removed the member", result});
        } catch (error) {
            if (error.message === "Trainer not found") {
                return res.status(404).json({ message: error.message });
            }

            debuggerLog("removeMember Controller" + error.message);
            return res.status(500).json({ message: "Server Error", error: error.message });
        }
    }
}

export default new TrainerManagementController();