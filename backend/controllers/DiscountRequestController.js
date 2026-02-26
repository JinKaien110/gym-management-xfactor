import DiscountRequestService from "../services/discountrequest.service.js";
import { debuggerLog } from "../utils/debuggerLog.js";


class DiscountRequestController {
    async createDiscountRequest(req, res, next) {
        try {
            const result = await DiscountRequestService.createDiscountRequest(req.auditMeta, req.files, req.user);

            return res.status(200).json(result);
        } catch (error) {
            debuggerLog("createDiscountRequest Controller: " + error.message);
            next(error);
        }
    }
    async decisionOnDiscountRequest(req, res, next) {
        try {
            const result = await DiscountRequestService.decisionOnDiscountRequest(req.params.id, req.auditMeta, req.body.decision, req.user);

            return res.status(200).json({ message: "Successfully updated the discount request", result});
        } catch (error) {
            debuggerLog("decisionOnDiscountRequest Controller: " + error.message);
            next(error);
        }
    }

    async findDiscountRequestById(req, res, next) {
        try {
            const result = await DiscountRequestService.findDiscountRequestById(req.params.id, req.user);

            return res.status(200).json(result);
        } catch (error) {
            debuggerLog("findDiscountRequestById Controller: " + error.message);
            next(error);
        }
    }

    async getAllDiscountRequests(req, res, next) {
        try {
            const result = await DiscountRequestService.getAllDiscountRequests(req.query);

            return res.status(200).json(result);
        } catch (error) {
            debuggerLog("getAllDiscountRequests Controller: " + error.message);
            next(error);
        }
    }
}

export default new DiscountRequestController();