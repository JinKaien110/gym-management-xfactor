import { ValidationError } from "../errors/ValidationError.js";
import AuditLogsService from "./audit.logs.service.js"; 
import AdminModel from "../models/AdminModel.js";
import { ObjectId } from "mongodb";
import { hashedPassword } from "../utils/hashedPassword.js";

class AdminService {
    async createAdmin(meta, body, updater) {
        let { first_name, last_name, email, password } = body;
        if(!updater.id || !ObjectId.isValid(updater.id)) {
            throw new ValidationError("Invalid superadmin ID");
        }

        if(!email || !password || !first_name || !last_name) {
            throw new ValidationError("Please fill out the necessary fields");
        }

        const Exist = await AdminModel.viewAdminByEmail(email);
        if(Exist) {
            throw new ValidationError("Admin email already exist");
        }
        
        password = await hashedPassword(password);

        const sanitized = {
            first_name: first_name.trim().toLowerCase(),
            last_name: last_name.trim().toLowerCase(),
            email: email.trim(),
            password,
            role: "admin",
            createdAt: new Date(),
            createdBy: new ObjectId(updater.id),
            updatedAt: null,
            updatedBy: null,
        };

        return await AuditLogsService.auditWrap({
            action: "CREATE_ADMIN",
            entity: "member",
            actor: { id: new ObjectId(updater.id), role: updater.role  }, 
            meta: meta,
            summary: `${updater.first_name} create an Admin Account`,
            fn: async () => {
                return AdminModel.createAdmin(sanitized);
            }
        });
        
    }

    async updatePassword(id, meta, password, updater) {
        if(!id || !ObjectId.isValid(id)) {
            throw new ValidationError("Invalid admin ID");
        }

        const Exist = await AdminModel.viewAdmin(new ObjectId(id));
        if(!Exist) {
            throw new ValidationError("No admin found");
        }

        if(!updater.id || !ObjectId.isValid(updater.id)) {
            throw new ValidationError("Invalid superadmin ID");
        }

        if(!password) throw new ValidationError("Password is missing");

        password = await hashedPassword(password);

        const sanitized = {
            password: password,
            updatedAt: new Date(),
            updatedBy: new ObjectId(updater.id)
        }

        return await AuditLogsService.auditWrap({
            action: "UPDATE_ADMIN_PASSWORD",
            entity: "member",
            actor: { id: new ObjectId(updater.id), role: updater.role  }, 
            meta: meta,
            summary: `${updater.first_name} updated ${Exist.email} admin password`,
            changes: {
                patch: "password",
            },
            fn: async () => {
                return AdminModel.updatePassword(
                    new ObjectId(id),
                    sanitized
                );
            }
        });
    }
}

export default new AdminService();