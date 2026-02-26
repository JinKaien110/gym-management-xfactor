import { ObjectId } from "mongodb";
import dotenv from "dotenv";
import { debuggerLog } from "../utils/debuggerLog.js";
import TrainerManagementModel from "../models/TrainerManagementModel.js";
import checkDuplicate from "../utils/checkDuplicate.js";
import { hashedPassword } from "../utils/hashedPassword.js";
import TrainerService from "../services/trainer.service.js";

dotenv.config();

class TrainerManagementController {
    async createTrainer(req, res, next) {
        try {
            const result = await TrainerService.createTrainer(req.body, req.user);

            return res.status(201).json({ message: "Successfully added a new trainer", result });

        } catch (error) {
            debuggerLog("createTrainer Controller" + error.message);
            next(error);
        }
    }

    async listTrainers(req, res, next) {
        try {
            const result = await TrainerService.listTrainers(req.query);

            return res.status(200).json(result);
        } catch (error) {
            debuggerLog("listTrainers Controller" + error.message);
            next(error);
        }
    }

    async getTrainer(req, res, next) {
        try {
            const result = await TrainerService.getTrainer(req.params.id)

            return res.status(200).json(result);
        } catch (error) {
            if (error.message === "No trainer found") {
                next(error);
            }

            debuggerLog("getTrainer Controller" + error.message);
            next(error);
        }
    }

    async updateTrainerProfile(req, res, next) {
        try {
            const result = await TrainerService.updateTrainerProfile(req.params.id, req.body, req.user);
            
            return res.status(200).json({ message: "Successfully updated the trainer", result});
        } catch (error) {
            if (error.message === "Trainer not found") {
                next(error);
            }

            debuggerLog("getTrainer Controller" + error.message);
            next(error);
        }
    }

    async updateTrainerStatus(req, res, next) {
        try {
            const result = await TrainerService.updateTrainerStatus(req.params.id, req.body.status, req.user.id);

            return res.status(200).json({ message: "Successfully updated the trainer status", result});
        } catch (error) {
            if (error.message === "Trainer not found") {
                next(error);
            }

            debuggerLog("getTrainer Controller" + error.message);
            next(error);
        }
    }

    async assignMember(req, res, next) {
        try {
            const result = await TrainerService.assignMember(req.params.id, req.auditMeta, req.body, req.user);

            return res.status(200).json({ message: "Successfully added the member", result});
        } catch (error) {
            if (error.message === "Trainer not found") {
                next(error);
            }

            debuggerLog("assignMember Controller" + error.message);
            next(error);
        }
    }

    async removeMember(req, res, next) {
        try {
            const result = await TrainerService.removeMember(req.params.id, req.auditMeta, req.body, req.user);

            return res.status(200).json({ message: "Successfully removed the member", result});
        } catch (error) {
            if (error.message === "Trainer not found") {
                next(error);
            }

            debuggerLog("removeMember Controller" + error.message);
            next(error);
        }
    }
}

export default new TrainerManagementController();