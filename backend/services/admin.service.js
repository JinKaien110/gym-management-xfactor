import { ValidationError } from "../errors/ValidationError.js";
import AuditLogsService from "./audit.logs.service.js"; 
import AdminModel from "../models/AdminModel.js";
import { ObjectId } from "mongodb";
import { hashedPassword } from "../utils/hashedPassword.js";
import { emailCreateAdmin } from "../templates/auth/email.createAdmin.js";
import { sendEmail } from "./email.service.js";
import { emailUpdateAdminPassword } from "../templates/auth/email.updatePassword.js";
import { generateRandomPassword } from "../utils/generateRandomPassword.js";

class AdminService {
    async createAdmin(meta, body, updater) {
        let { first_name, last_name, role, email, user_type } = body;
        
        if(!updater.id || !ObjectId.isValid(updater.id)) {
            throw new ValidationError("Invalid superadmin ID");
        }

        if(!email || !first_name || !last_name || !role || !user_type) {
            throw new ValidationError("Please fill out the necessary fields");
        }

        const Exist = await AdminModel.viewAdminByEmail(email);
        if(Exist) {
            throw new ValidationError("Admin email already exist");
        }

        const allowedRoles = ["admin", "staff", "superadmin"];
        if(!allowedRoles.includes(role)) throw new ValidationError("Not allowed role value");

        if(user_type !== "admin") throw new ValidationError("Not allowed user type value");
        
        let password = generateRandomPassword(); 
        password = await hashedPassword(password);

        const sanitized = {
            first_name: first_name.trim(),
            last_name: last_name.trim(),
            email: email.trim().toLowerCase(),
            password,
            role: role.trim().toLowerCase(),
            user_type: user_type.trim().toLowerCase(),
            createdAt: new Date(),
            createdBy: new ObjectId(updater.id),
            updatedAt: null,
            updatedBy: null,
        };

        await AuditLogsService.auditWrap({
            action: "ADMIN_CREDENTIALS_EMAIL_SENT",
            entity: "admins",
            actor: { id: new ObjectId(updater.id), role: updater.role, user_type: updater.user_type }, 
            meta: meta,
            summary: `${sanitized.first_name.trim()} ${sanitized.last_name.trim()} (${updater.role} → ${updater.user_type}) has been sent an email credentials`,

            fn: async () => {
                return await sendEmail({
                    to: sanitized.email,
                    subject: "6Pack Iron City - ADMIN CREATION",
                    html: emailCreateAdmin(sanitized, password)
                });
            }
        })

        return await AuditLogsService.auditWrap({
            action: "ADMIN_CREATED",
            entity: "admins",
            actor: { id: new ObjectId(updater.id), role: updater.role, user_type: updater.user_type  }, 
            meta: meta,
            summary: `${updater.first_name} ${updater.last_name} (${updater.role} → ${updater.user_type}) created an Admin Account`,
            fn: async () => {
                return AdminModel.createAdmin(sanitized);
            }
        });
        
    }

    async updatePassword(id, meta, password, updater) {
        if(!id || !ObjectId.isValid(id)) {
            throw new ValidationError("Invalid admin ID");
        }

        const rawPassword = String(password).trim();
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

        await AuditLogsService.auditWrap({
            action: "ADMIN_PASSWORD_EMAIL_NOTIFICATION",
            entity: "admins",
            actor: { id: new ObjectId(updater.id), role: updater.role, user_type: updater.user_type }, 
            meta: meta,
            summary: `${updater.first_name.trim()} ${updater.last_name.trim()} (${updater.role} → ${updater.user_type})has been sent an email new password`,
            fn: async () => {
                await sendEmail({
                    to: Exist.email,
                    subject: "6Pack Iron City - ADMIN PASSWORD",
                    html: emailUpdateAdminPassword(updater, rawPassword)
                });
            }
        })

        return await AuditLogsService.auditWrap({
            action: "ADMIN_UPDATE_PASSWORD",
            entity: "admins",
            actor: { id: new ObjectId(updater.id), role: updater.role  }, 
            meta: meta,
            summary: `${updater.first_name} ${updater.last_name} (${updater.role} → ${updater.user_type}) updated ${Exist.first_name} ${Exist.last_name} admin password`,
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