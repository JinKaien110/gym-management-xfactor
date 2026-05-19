import { ValidationError } from "../errors/ValidationError.js";
import AuditLogsService from "../services/audit.logs.service.js";
import { debuggerLog } from "../utils/debuggerLog.js";

class AuditLogController {
    async showAuditLogs(req, res, next) {
        try {
            const result = await AuditLogsService.showAuditLogs(req.query, req.user);

            return res.status(200).json(result);
        } catch (error) {
            debuggerLog("showAuditLogs Controller: " + error.message);
            next(error);
        }
    }

    async viewOneAuditLog(req, res, next) {
        try {
            const result = await AuditLogsService.viewOneAuditLog(req.params.id);

            return res.status(200).json(result);
        } catch (error) {
            debuggerLog("viewOneAuditLog Controller: " + error.message);
            next(error);
        }
    }
}

export default new AuditLogController();