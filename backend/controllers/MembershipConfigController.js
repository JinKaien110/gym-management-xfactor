import MembershipConfigModel from "../models/MembershipConfigModel.js";
import MembershipConfigService from "../services/membership.config.service.js";
import StatusService from "../services/status.service.js";
import { debuggerLog } from "../utils/debuggerLog.js";


class MembershipConfigController {

    async getAll(req, res, next) {
        try {
            const result = await MembershipConfigService.getAll(req.query);

            return res.status(200).json(result);
        } catch (error) {
            debuggerLog("getAll Controller", error);
            next(error)
        }
    }

    async getmembershipConfig(req, res, next) {
        try {
            const result = await MembershipConfigService.getmembershipConfig(req.params.id);
            return res.status(200).json(result);
        } catch (error) {
            debuggerLog("getmembershipConfig Controller", error);
            next(error)
        }
    }

    async showCurrentmembershipConfig(req, res, next) {
        try {
            const result = await MembershipConfigModel.showCurrentmembershipConfig();
            return res.status(200).json(result);
        } catch (error) {
            debuggerLog("showCurrentmembershipConfig Controller", error);
            next(error)
        }
    }

    async create(req, res, next) {
        try {
            const result = await MembershipConfigService.create(req.auditMeta, req.body, req.user)

            return res.status(201).json({ message: "Successfully created a membership config", result});
        } catch (error) {
            debuggerLog("create Controller", error);
            next(error)
        }
    }

    async edit(req, res, next) {
        try {
            const result = await MembershipConfigService.edit(req.params.id, req.auditMeta, req.body, req.user)

            return res.status(201).json({ message: "Successfully edited a membership config", result});
        } catch (error) {
            debuggerLog("edit Controller", error);
            next(error)
        }
    }

    async status(req, res, next) {
        try {
            const result = await StatusService.status("membership_config", req.params.id, req.body.status, req.auditMeta, req.user)

            return res.status(201).json({ message: "Successfully updated status of membership config", result});
        } catch (error) {
            debuggerLog("status Controller", error);
            next(error)
        }
    }
}

export default new MembershipConfigController();