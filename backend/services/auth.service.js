import { ValidationError } from "../errors/ValidationError.js";
import AuditLogsService from "./audit.logs.service.js"; 
import AuthModel from "../models/AuthModel.js";
import MemberModel from "../models/MemberModel.js";
import TrainerManagementModel from "../models/TrainerManagementModel.js";
import { ObjectId } from "mongodb";
import { generateToken } from "../utils/generateToken.js";
import { hashedPassword } from "../utils/hashedPassword.js";
import checkDuplicate from "../utils/checkDuplicate.js";
import MembershipModel from "../models/MembershipModel.js";
import MembershipService from "./membership.service.js";


class AuthService {
    async loginUser(meta, body) {
        const { email, password } = body;

        if (!email || !password) {
            throw new ValidationError("Please fill out the necessary field.");
        }

        const sanitizedEmail = String(email).trim().toLowerCase();
        const sanitizedPassword = String(password).trim();

        const [member, trainer] = await Promise.all([
            AuthModel.FindUserByEmail(sanitizedEmail),
            TrainerManagementModel.findTrainerByEmail(sanitizedEmail),
        ]);

        
        const account = member || trainer;
        
        if (!account) {
            throw new ValidationError("No user found.");
        }

        const isPasswordMatch = await AuthModel.ValidatePassword(
            sanitizedPassword,
            account.password
        );

        if (!isPasswordMatch) {
            throw new ValidationError("Incorrect password." );
        }

        // 3) Generate token from the same account
        const token = generateToken({
            id: account._id,
            first_name: account.first_name,
            last_name: account.last_name,
            email: account.email,
            role: account.role, 
        });


        // 5) Return user payload depending on role
        const userPayload = {
            id: account._id,
            first_name: account.first_name,
            last_name: account.last_name,
            email: account.email,
            role: account.role,
        };

        // include member-only fields
        if (account.role === "member") {
            userPayload.member_type = account.member_type;
            userPayload.gender = account.gender;
            userPayload.age = account.age;
            userPayload.height = account.height;
            userPayload.weight = account.weight;
            userPayload.bmi = account.bmi;
            userPayload.fitness_goal = account.fitness_goal;
        }

        // include trainer-only fields (example)
        if (account.role === "trainer") {
            userPayload.specialty = account.specialty;
            userPayload.certifications = account.certifications;
        }

        return await AuditLogsService.auditWrap({
            action: "LOGIN_USER",
            entity: account.role,
            actor: { id: account._id, role: account.role  }, 
            meta: meta,
            summary: `${account.first_name} (${account.role}) has logged in`,
            fn: async () => {
                return {
                    token,
                    userPayload
                };
            }
        });
    }

    async RegisterUser(meta, body) {
        const { email, first_name, last_name, phone, password, member_type } = body;
        if(!email?.trim() || !password?.trim() || !first_name?.trim() || !last_name?.trim() || !phone?.trim() || !member_type) {
            throw new ValidationError("Please fillout the necessary field.");
        }

        await checkDuplicate(null, {email, phone})

        const hash = await hashedPassword(password.trim())
        
        const sanitized = {
            first_name: first_name.trim(),
            last_name: last_name.trim(),
            email: email.trim().toLowerCase(),
            phone: phone.trim(),
            address: null,
            password: hash,
            role: "member",
            status: "active",
            member_type: member_type.trim().toLowerCase(),
            gender: null,
            date_of_birth: null,
            height: null,
            weight: null,
            bmi: null,
            fitness_goal: [],
            medical_condition: null,
            trainer_id: null,
            emergency_name: null,
            emergency_contact: null,
            emergency_relationship: null,
            qr_code: null,
            createdAt: new Date(),
            createdBy: "self",
            updatedAt: new Date(),
            updatedBy: "self",
            archivedAt: null,
            archivedBy: null
        }

        const UserExist = await AuthModel.FindUserByEmail(sanitized.email);
        if(UserExist) throw new ValidationError("User already existed.");

        return await AuditLogsService.auditWrap({
            action: "REGISTER_USER",
            entity: "member",
            actor: { email: email.trim().toLowerCase(), role: "member" }, 
            meta: meta,
            summary: `${email.trim().toLowerCase()} has registered`,
            fn: async () => {
                const { client } = await connectDB();
                const session = client.startSession();

                try {
                    session.startTransaction();

                    const updater = await MemberModel.RegisterUser(sanitized, session);
                    await MembershipService.createMembershipRequest(meta, body, updater, session)
                    await session.commitTransaction();
                } catch (error) {
                    await session.abortTransaction();
                    throw new ValidationError(error.message)
                } finally {
                    await session.endSession();
                }
                return;
            }
        });
    } 
}

export default new AuthService();