import PlanService from "../services/plan.service.js";
import { debuggerLog } from "../utils/debuggerLog.js";

class PlanController {

async createPlans(req, res, next) {
        try {
            const result = await PlanService.createPlans(req.auditMeta, req.body, req.user);

            return res.status(201).json({ 
                message: " You successfully added a new plan",
                result
            });

        } catch (error) {
            debuggerLog("createPlansController Controller", error);
            next(error)
        }
    }

    async viewAllPlans(req, res, next) {
        try {
           const result = await PlanService.viewAllPlans(req.query)
            return res.status(200).json(result);
        } catch (error) {
            debuggerLog("viewAllPlans Controller", error);
            next(error)
        }
    }

    async viewAPlan(req, res, next) {
        try {
            const result = await PlanService.viewAPlan(req.params.id);
            return res.status(200).json(result);
        } catch (error) {
            debuggerLog("viewAPlan Controller", error);
            next(error)
        }
    }

    async updatePlan(req, res, next) {
        try {
            const result = await PlanService.updatePlan(req.params.id, req.auditMeta, req.body, req.user); 
            return res.status(200).json(result)
        } catch (error) {
            debuggerLog("updatePlan Controller", error);
            next(error)
        }
    }

    async updatePlanStatus(req, res, next) {
        try {
            const result = await PlanService.updatePlanStatus(req.params.id, req.auditMeta, req.body.status, req.user)
            return res.status(200).json(result);
        } catch (error) {
            debuggerLog("updatePlanStatus Controller", error);
            next(error)
        }
    }
}

export default new PlanController();