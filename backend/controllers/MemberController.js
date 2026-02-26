import dotenv from "dotenv";
import { debuggerLog } from "../utils/debuggerLog.js";
import { generateQrCode } from "../utils/generateQrCode.js";
import MemberModel from "../models/MemberModel.js";
import MemberService from "../services/member.service.js";

dotenv.config();

class MemberController {

    async PostForm(req, res, next) {
        try {
            const result = await MemberService.PostForm(req.body, req.auditMeta, req.user);
            return res.status(200).json({ message: "Successfully updated member record!", result});

        } catch (error) {
            debuggerLog("Post Form Controller", error);
            next(error);
        }
    } 

    async selectTrainer(req, res, next) {
        try {
            const result = await MemberService.selectTrainer(req.params.id, req.auditMeta, req.user);
            
            return res.status(200).json({ message: "You have now a trainer", result });
        } catch (error) {
            debuggerLog("selectTrainer Controller", error);
            next(error)
        }
    }

    async listOfTrainersAfterPostForm(req, res, next) {
        try {
            const result = await MemberService.listOfTrainersAfterPostForm(req.user);

            return res.status(200).json(result);

        } catch (error) {
            debuggerLog("listOfTrainersAfterPostForm Controller" + error.message);
            next(error)
        }
    }


    /**
     * ADMIN FUNCTIOSN BELOW
     */

    async createMember(req, res, next) {
        try {
            const result = await MemberService.createMember(req.body, req.auditMeta, req.user);
            return res.status(201).json({ message: "Successfully created a member", result});
        } catch (error) {
            debuggerLog("createMember Controller: ", error);
            next(error);
        }
    }

    async listMembers(req, res, next) {
        try {
            const result = await MemberService.listMembers(req.query);
            return res.status(200).json(result);
        } catch (error) {
            debuggerLog("listMembers Model: ", error);
            next(error);
        }
    }

    async viewMember(req, res, next) {
        try {
            const result = await MemberService.viewMember(req.params.id)
            return res.status(200).json(result);
        } catch (error) {
            debuggerLog("viewMember Model: ", error);
            next(error);
        }
    }

    async updateMemberProfile(req, res, next) {
        try {
            const result = await MemberService.updateMemberProfile(req.params.id, req.body, req.auditMeta, req.user);
            return res.status(202).json({ message: "Successfully updated the member details", result});
 
        } catch (error) {
            debuggerLog("updateMemberProfile Model: ", error);
            next(error)
        }
    }

    async updateUserStatus(req, res, next) {
        try {
            const result = await MemberService.updateUserStatus(req.params.id, req.body.status, req.auditMeta, req.updater);
            return res.status(200).json({ message: "Successfully updated member and membership status", result});
        } catch (error) {
            debuggerLog("updateUserStatus Model: ", error);
            next(error)
        }
    }

    async getMemberQrCode(req, res, next) {
        try {
            const memberId = req.params.id;
            const qrCodeUrl = await generateQrCode(memberId);
            return res.status(200).json({ qrCode: qrCodeUrl });
        } catch (error) {
            debuggerLog("getMemberQrCode Controller: ", error);
            next(error);
        }
    }

    async assignATrainer(req, res, next) {
        try {
            const result = await MemberService.assignATrainer(req.params.id, req.body.status, req.auditMeta, req.updater)
            return res.status(200).json({ message: `Successfully assigned a trainer`, result });
            
        } catch (error) {
            debuggerLog("assignATrainer Model: ", error);
            next(error)
        }
    }
}

export default new MemberController();
