import { debuggerLog } from "../utils/debuggerLog.js";

class DiscountRequestController {
    async createDiscountRequest(req, res, next) {
        try {
            const result = await DiscountRequestService.decisionOnDiscountRequest(req.auditMeta, req.body, req.user);

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
}

export default new DiscountRequestController();