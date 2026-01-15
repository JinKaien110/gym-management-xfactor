import ClassService from "../services/class.service.js";
import { debuggerLog } from "../utils/debuggerLog.js";

class ClassController {
    async createClass(req, res, next) {
        try {
            const result = await ClassService.createClass(req.body, req.user);

            return res.status(201).json({ message: "Successfully create a class", result});
        } catch (error) {
            debuggerLog("Server Error: ", error)
            next(error)
        }
    }

    async viewClass(req, res, next) {
        try {
            const result = await ClassService.viewClass(req.params.id);

            return res.status(201).json(result);
        } catch (error) {
            debuggerLog("Server Error: ", error)
            next(error)
        }
    }

    async viewAllClass(req, res, next) {
        try {
            const result = await ClassService.viewAllClass(req.query);

            return res.status(201).json(result);
        } catch (error) {
            debuggerLog("Server Error: ", error)
            next(error)
        }
    }

    async updateClass(req, res, next) {
        try {
            const result = await ClassService.updateClass(req.params.id, req.body, req.user);

            return res.status(201).json({ message: "Successfully update a class", result});
        } catch (error) {
            debuggerLog("Server Error: ", error)
            next(error)
        }
    }

    async updateClassStatus(req, res, next) {
        try {
            const result = await ClassService.updateClassStatus(req.params.id, req.body, req.user);

            return res.status(201).json({ message: "Successfully update a class status", result});
        } catch (error) {
            debuggerLog("Server Error: ", error)
            next(error)
        }
    }
}

export default new ClassController();