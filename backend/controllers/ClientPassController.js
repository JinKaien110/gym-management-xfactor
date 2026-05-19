import ClientPassService from "../services/client.pass.service.js";
import StatusService from "../services/status.service.js";
import { debuggerLog } from "../utils/debuggerLog.js";

class ClientPassController {

    async createclientPass(req, res, next) {
        try {
            const result = await ClientPassService.createclientPass(req.auditMeta, req.body, req.user)

            return res.status(201).json({ message: "Successfully created a client pass", result});
        } catch (error) {
            debuggerLog("createclientPass Controller", error);
            next(error)
        }
    }

    async status(req, res, next) {
        try {
            const result = await StatusService.status("clients_pass", req.params.id, req.body.status, req.auditMeta, req.user)

            return res.status(201).json({ message: "Successfully updated client pass status", result});
        } catch (error) {
            debuggerLog("status Controller", error);
            next(error)
        }
    }

    async findclientPass(req, res, next) {
        try {
            const result = await ClientPassService.findclientPass(req.user.id);

            return res.status(201).json(result);
        } catch (error) {
            debuggerLog("findclientPass Controller", error);
            next(error)
        }
    }

    async findActiveclientPass(req, res, next) {
        try {
            const result = await ClientPassService.findActiveclientPass(req.user.id);
            return res.status(201).json(result);
        } catch (error) {
            debuggerLog("findActiveclientPass Controller", error);
            next(error)
        }
    }


    async findAllclientPass(req, res, next) {
        try {
            const result = await ClientPassService.findAllclientPass(req.query);

            return res.status(201).json(result);
        } catch (error) {
            debuggerLog("findAllclientPass Controller", error);
            next(error)
        }
    }

}

export default new ClientPassController();