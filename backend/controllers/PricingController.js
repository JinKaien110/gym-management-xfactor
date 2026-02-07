import PricingService from "../services/pricing.service.js";
import { debuggerLog } from "../utils/debuggerLog.js";

class PricingController {
    async createPricing(req, res, next) {
        try {
            const result = await PricingService.createPricing(req.auditMeta, req.body, req.user);

            return res.status(201).json({ message: "You successfully added a new pricing", result: result.insertedId});

        } catch  (error) {
            debuggerLog("createPricingController Controller", error);
            next(error);
        }
    }

    async viewAllPricing(req, res, next) {
        try {
            const result = await PricingService.viewAllPricing(req.query);

            return res.status(200).json(result);

        } catch (error) {
            debuggerLog("viewAllPricing Controller", error);
            next(error);
        }
    }

    async viewOnePricing(req, res, next) {
        try {
            const result = await PricingService.viewOnePricing(req.params.id);

            return res.status(200).json(result);

        } catch (error) {
            debuggerLog("viewOnePricing Controller", error);
            next(error);
        }
    }

    async viewPricingByPlan(req, res, next) {
        try {
            const result = await PricingService.viewPricingByPlan(req.params.id);

            return res.status(200).json(result);

        } catch (error) {
            debuggerLog("viewPricingByPlan Controller", error);
            next(error);
        }
    }

    async updatePricing(req, res, next) {
        try {
            const result = await PricingService.updatePricing(req.params.id, req.auditMeta, req.body, req.user);

            return res.status(200).json({ message: "Successfully updated the price", result});

        } catch(error) {
            debuggerLog("updatePricing Controller", error);
            next(error)
        }
    }

    async updatePricingStatus(req, res, next) {
        try {
            const result = await PricingService.updatePricingStatus(req.params.id, req.auditMeta, req.body.status, req.user);

            return res.status(200).json({ message: "Successfully updated the price status", result});

        } catch (error) {
            debuggerLog("updatePricingStatus Controller", error);
            next(error);
        }
    }
}

export default new PricingController();