import { ObjectId } from "mongodb";
import dotenv from "dotenv";
import { debuggerLog } from "../utils/debuggerLog.js";
import MembershipModel from "../models/MembershipModel.js";
import MembershipService from "../services/membership.service.js";
dotenv.config();

class MembershipController {

    async createMembershipRequest(req, res, next) {
        try {
            const result = await MembershipService.createMembershipRequest(req.auditMeta, req.body, req.user);

            return res.status(201).json({ message: "Successfully created the membership", result});
        } catch (error) {
            debuggerLog("createMembership Controller: ", error);
            next(error)
        }
    }

    async viewMembership(req, res, next) {
        try {
            const result = await MembershipService.viewMembership(req.params.id);

            return res.status(200).json(result);
        } catch (error) {
            debuggerLog("viewMembership Controller: ", error);
            next(error)
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

    async updateMembership(req, res, next) {
        try {
            const result = await MembershipService.updateMembership(req.params.id, req.auditMeta, req.body, req.user);

            return res.status(200).json({ message: "Successfully updated the membership", result});
        } catch (error) {
            debuggerLog("updateMembership Controller: ", error);
            next(error)
        }
    }

    async updateMembershipStatus(req, res, next) {
        try {
            const result = await MembershipService.updateMembershipStatus(req.params.id, req.auditMeta, req.body, req.user);

            return res.status(200).json({ message: "Successfully updated the membership status", result});
        } catch (error) {
            debuggerLog("updateMembershipStatus Controller: ", error);
            next(error)
        }
    }
    
    async freezeMembership(req, res, next) {
        try {
            const result = await MembershipService.freezeMembership(req.params.id, req.auditMeta, req.body, req.user);

            return res.status(200).json({ message: "Successfully freeze the membership", result});
        } catch (error) {
            debuggerLog("freezeMembership Controller: ", error);
            next(error)
        }
    }

    async unfreezeMembership(req, res, next) {
        try {
            const result = await MembershipService.unfreezeMembership(req.params.id, req.auditMeta, req.user);

            return res.status(200).json({ message: "Successfully unfreeze the membership", result});
        } catch (error) {
            debuggerLog("unfreezeMembership Controller: ", error);
            next(error)
        }
    }
} 

export default new MembershipController();
