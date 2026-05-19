import dotenv from "dotenv";
import { debuggerLog } from "../utils/debuggerLog.js";
import { generateQrCode } from "../utils/generateQrCode.js";
import ClientModel from "../models/ClientModel.js";
import ClientService from "../services/client.service.js";

dotenv.config();

class ClientController {

    async PostForm(req, res, next) {
        try {
            const result = await ClientService.PostForm(req.body, req.auditMeta, req.user);
            return res.status(200).json({ message: "Successfully updated client record!", result});

        } catch (error) {
            debuggerLog("Post Form Controller", error);
            next(error);
        }
    }
    

    async updateProfile(req, res, next) {
        try {
            const result = await ClientService.updateProfile(req.params.id, req.body, req.auditMeta, req.user);
            return res.status(202).json({ message: "Successfully updated the your profile", result});
 
        } catch (error) {
            debuggerLog("updateProfile Model: ", error);
            next(error)
        }
    }

    async selectTrainer(req, res, next) {
        try {
            const result = await ClientService.selectTrainer(req.params.id, req.auditMeta, req.user);
            
            return res.status(200).json({ message: "You have now a trainer", result });
        } catch (error) {
            debuggerLog("selectTrainer Controller", error);
            next(error)
        }
    }

    async listOfTrainersAfterPostForm(req, res, next) {
        try {
            const result = await ClientService.listOfTrainersAfterPostForm(req.user);

            return res.status(200).json(result);

        } catch (error) {
            debuggerLog("listOfTrainersAfterPostForm Controller" + error.message);
            next(error)
        }
    }


    /**
     * ADMIN FUNCTIOSN BELOW
     */

    async createclient(req, res, next) {
        try {
            const result = await ClientService.createclient(req.body, req.auditMeta, req.user);
            return res.status(201).json({ message: "Successfully created a client", result});
        } catch (error) {
            debuggerLog("createclient Controller: ", error);
            next(error);
        }
    }

    async listclients(req, res, next) {
        try {
            const result = await ClientService.listclients(req.query);
            return res.status(200).json(result);
        } catch (error) {
            debuggerLog("listclients Model: ", error);
            next(error);
        }
    }

    async viewclient(req, res, next) {
        try {
            const result = await ClientService.viewclient(req.params.id)
            return res.status(200).json(result);
        } catch (error) {
            debuggerLog("viewclient Model: ", error);
            next(error);
        }
    }

    async updateclientProfile(req, res, next) {
        try {
            const result = await ClientService.updateclientProfile(req.params.id, req.body, req.auditMeta, req.user);
            return res.status(202).json({ message: "Successfully updated the client details", result});
 
        } catch (error) {
            debuggerLog("updateclientProfile Model: ", error);
            next(error)
        }
    }

    async updateUserStatus(req, res, next) {
        try {
            const result = await ClientService.updateUserStatus(req.params.id, req.body.status, req.auditMeta, req.updater);
            return res.status(200).json({ message: "Successfully updated client and membership status", result});
        } catch (error) {
            debuggerLog("updateUserStatus Model: ", error);
            next(error)
        }
    }

    async getclientQrCode(req, res, next) {
        try {
            const clientId = req.params.id;
            const qrCodeUrl = await generateQrCode(clientId);
            return res.status(200).json({ qrCode: qrCodeUrl });
        } catch (error) {
            debuggerLog("getclientQrCode Controller: ", error);
            next(error);
        }
    }

    async assignATrainer(req, res, next) {
        try {
            const result = await ClientService.assignATrainer(req.params.id, req.body.status, req.auditMeta, req.updater)
            return res.status(200).json({ message: `Successfully assigned a trainer`, result });
            
        } catch (error) {
            debuggerLog("assignATrainer Model: ", error);
            next(error)
        }
    }

    /**
     * client PROFILE ROUTES
     */

    async getclientProfile(req, res, next) {
        try {
            const clientId = req.user.id;
            const result = await ClientService.getclientProfileSelf(clientId);
            return res.status(200).json(result);
        } catch (error) {
            debuggerLog("getclientProfile Controller", error);
            next(error);
        }
    }

    async updateclientProfileSelf(req, res, next) {
        try {
            const clientId = req.user.id;
            const result = await ClientService.updateclientProfileSelf(clientId, req.body, req.auditMeta, req.user);
            return res.status(202).json({ message: "Successfully updated your profile", result});
        } catch (error) {
            debuggerLog("updateclientProfileSelf Controller", error);
            next(error);
        }
    }

    // Progress Log Methods
    async getProgressLog(req, res, next) {
        try {
            const clientId = req.user.id;
            const result = await ClientModel.getProgressLog(clientId);
            // Sort by date descending (newest first)
            const sorted = result.sort((a, b) => new Date(b.date) - new Date(a.date));
            return res.status(200).json({ result: sorted });
        } catch (error) {
            debuggerLog("getProgressLog Controller", error);
            next(error);
        }
    }

    async addProgressEntry(req, res, next) {
        try {
            const clientId = req.user.id;
            const result = await ClientModel.addProgressEntry(clientId, req.body);
            return res.status(201).json({ message: "Progress entry added successfully", result });
        } catch (error) {
            debuggerLog("addProgressEntry Controller", error);
            next(error);
        }
    }

    async updateProgressEntry(req, res, next) {
        try {
            const clientId = req.user.id;
            const { entryId } = req.params;
            const result = await ClientModel.updateProgressEntry(clientId, entryId, req.body);
            return res.status(200).json({ message: "Progress entry updated successfully", result });
        } catch (error) {
            debuggerLog("updateProgressEntry Controller", error);
            next(error);
        }
    }

    async deleteProgressEntry(req, res, next) {
        try {
            const clientId = req.user.id;
            const { entryId } = req.params;
            const result = await ClientModel.deleteProgressEntry(clientId, entryId);
            return res.status(200).json({ message: "Progress entry deleted successfully", result });
        } catch (error) {
            debuggerLog("deleteProgressEntry Controller", error);
            next(error);
        }
    }
}

export default new ClientController();
