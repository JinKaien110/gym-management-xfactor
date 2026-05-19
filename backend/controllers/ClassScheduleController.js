import ClassScheduleService from "../services/class.schedule.service.js";
import { debuggerLog } from "../utils/debuggerLog.js";

class ClassScheduleController {
    async createClassSchedule(req, res, next) {
        try {
            const result = await ClassScheduleService.createClassSchedule(req.auditMeta, req.body, req.user);

            return res.status(201).json({ message: "Successfully created a class schedule", result});
        } catch (error) {
            debuggerLog("Server Error: ", error)
            next(error)
        }
    }

    async viewClassSchedule(req, res, next) {
        try {
            const result = await ClassScheduleService.viewClassSchedule(req.params.id);

            return res.status(201).json(result);
        } catch (error) {
            debuggerLog("Server Error: ", error)
            next(error)
        }
    }
    
    async viewAllClassSchedule(req, res, next) {
        try {
            const result = await ClassScheduleService.viewAllClassSchedule(req.query);

            return res.status(201).json(result);
        } catch (error) {
            debuggerLog("Server Error: ", error)
            next(error)
        }
    }
    
    async updateClassSchedule(req, res, next) {
        try {
            const result = await ClassScheduleService.updateClassSchedule(req.params.id, req.auditMeta, req.body, req.user);

            return res.status(201).json({ message: "Successfully updated a class schedule", result});
        } catch (error) {
            debuggerLog("Server Error: ", error)
            next(error)
        }
    }

    async updateClassScheduleStatus(req, res, next) {
        try {
            const result = await ClassScheduleService.updateClassScheduleStatus(req.params.id, req.auditMeta, req.body.status, req.user);

            return res.status(201).json({ message: "Successfully updated a class schedule status", result});
        } catch (error) {
            debuggerLog("Server Error: ", error)
            next(error)
        }
    }

    async viewClassScheduleAssignedToMe(req, res, next) {
         try {
            const result = await ClassScheduleService.viewClassScheduleAssignedToMe(req.user, req.query);

            return res.status(200).json(result);
        } catch (error) {
            debuggerLog("Server Error: ", error)
            next(error)
        }
    }
}

export default new ClassScheduleController();