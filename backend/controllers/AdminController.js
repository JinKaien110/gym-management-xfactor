import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { ObjectId } from "mongodb";
import { debuggerLog } from "../utils/debuggerLog.js";
import AdminService from "../services/admin.service.js";

dotenv.config();

class AdminController {
    async createAdmin(req, res, next) {
        try {
            const result = await AdminService.createAdmin(req.auditMeta, req.body, req.user);
            return res.status(201).json({ messaage: "Successfully create new Admin", result});
        } catch (error) {
            debuggerLog("AdminController CreateAdmin: " + error);
            next(error)
        }
    }

    async updatePassword(req, res, next) {
        try {
            const result = await AdminService.updatePassword(req.auditMeta, req.body.password, req.user);
            return res.status(200).json({ messaage: "Successfully updated password"});
        } catch (error) {
            debuggerLog("AdminController UpdateAdminPassword: " + error);
            next(error)
        }
    }
}

export default new AdminController();