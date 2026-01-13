import { ObjectId } from "mongodb";
import dotenv from "dotenv";
import { debuggerLog } from "../utils/debuggerLog.js";
import MembershipModel from "../models/MembershipModel.js";
import MembershipService from "../services/membership.service.js";
dotenv.config();

class MembershipController {

    async createMembershipRequest(req, res) {
        try {
            const result = await MembershipService.createMembershipRequest(req.user, req.body);

            return res.status(201).json({ message: "Successfully created the membership", result});
        } catch (error) {
            if (error.message.includes("Invalid") || error.message.includes("fill")) {
                return res.status(400).json({ message: error.message });
            }
            debuggerLog("createMembership Controller: ", error);
            return res.status(500).json({ message: "Server Error", error: error.message});
        }
    }

    async viewMembership(req, res) {
        try {
            const result = await MembershipService.viewMembership(req.params.id);

            return res.status(200).json(result);
        } catch (error) {
            debuggerLog("viewMembership Controller: ", error);
            return res.status(500).json({ message: "Server Error", error: error.message});
        }
    }

    async viewAllMembership(req, res, next) {
        try {
            const result = await MembershipService.viewAllMembership(req.query);

            return res.status(200).json(result);
        } catch (error) {
            debuggerLog("viewMembership Controller: ", error);
            next(error)
        }
    }

    async updateMembership(req, res) {
        try {
            const result = await MembershipService.updateMembership(req.params.id, req.body, req.user);

            return res.status(200).json({ message: "Successfully updated the membership", result});
        } catch (error) {
            debuggerLog("updateMembership Controller: ", error);
            return res.status(500).json({ message: "Server Error", error: error.message});
        }
    }

    async updateMembershipStatus(req, res) {
        try {
            const result = await MembershipService.updateMembershipStatus(req.params.id, req.body, req.user);

            return res.status(200).json({ message: "Successfully updated the membership status", result});
        } catch (error) {
            debuggerLog("updateMembershipStatus Controller: ", error);
            return res.status(500).json({ message: "Server Error", error: error});
        }
    }
    
    async freezeMembership(req, res) {
        try {
            const result = await MembershipService.freezeMembership(req.params.id, req.body, req.user);

            return res.status(200).json({ message: "Successfully freeze the membership", result});
        } catch (error) {
            debuggerLog("freezeMembership Controller: ", error);
            return res.status(500).json({ message: "Server Error", error: error.message});
        }
    }

    async unfreezeMembership(req, res) {
        try {
            const result = await MembershipService.unfreezeMembership(req.params.id, req.user);

            return res.status(200).json({ message: "Successfully unfreeze the membership", result});
        } catch (error) {
            debuggerLog("unfreezeMembership Controller: ", error);
            return res.status(500).json({ message: "Server Error", error: error.message});
        }
    }
} 

export default new MembershipController();
