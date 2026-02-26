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
import AdminModel from "../models/AdminModel.js";
import ucfirst from "../utils/ucfirst.js";
import { connectDB  } from "../config/db.js";
import { sendEmail } from "./email.service.js";
import PlanModel from "../models/PlanModel.js";
import PricingModel from "../models/PricingModel.js";
import MembershipRequestModel from "../models/MembershipRequestModel.js";
import DiscountRequestModel from "../models/DiscountRequestModel.js";


class AuthService {
    async loginUser(meta, body) {
        const { email, password } = body;

        if (!email || !password) {
            throw new ValidationError("Please fill out the necessary field.");
        }

        const sanitizedEmail = String(email).trim().toLowerCase();
        const sanitizedPassword = String(password).trim();

        const [member, trainer, admin] = await Promise.all([
            AuthModel.FindUserByEmail(sanitizedEmail),
            TrainerManagementModel.findTrainerByEmail(sanitizedEmail),
            AdminModel.viewAdminByEmail(sanitizedEmail)
        ]);

        const account = member || trainer || admin;
        
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
            user_type: account.user_type 
        });


        // 5) Return user payload depending on role
        const userPayload = {
            id: account._id,
            first_name: account.first_name,
            last_name: account.last_name,
            email: account.email,
            role: account.role,
            user_type: account.user_type 
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
            action: "AUTH_LOGIN",
            entity: account.role,
            entity_id: account._id,
            actor: { id: account._id, role: account.role, user_type: account.user_type  }, 
            meta: meta,
            summary: `${account.first_name} (${account.role-account.user_type}) has logged in`,
            fn: async () => {
                return {
                    token,
                    userPayload
                };
            }
        });
    }

    async RegisterUser(meta, body) {
        const { email, first_name, last_name, phone, password } = body;
        if(!email?.trim() || !password?.trim() || !first_name?.trim() || !last_name?.trim() || !phone?.trim()) {
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
            user_type: "member",
            status: "active",
            member_type: "pending",
            gender: null,
            date_of_birth: null,
            height: null,
            weight: null,
            bmi: null,
            fitness_goal: [],
            medical_condition: null,
            training_type: null,
            experience_level: null,
            days_per_week: null, 
            session_minutes: null,
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
            action: "AUTH_REGISTER",
            entity: "members",
            actor: { email: email.trim().toLowerCase(), role: "member", user_type: "member" }, 
            meta: meta,
            summary: `${email.trim().toLowerCase()} has registered`,
            fn: async () => {
                const { db, client } = await connectDB();
                const session = client.startSession();

                try {
                    session.startTransaction();

                    const updater = await MemberModel.RegisterUser(sanitized, session);

                    await MembershipService.requestMembership(meta, body, updater, session)
                    
                    await session.commitTransaction();
                    return updater;
                } catch (error) {
                    await session.abortTransaction();
                    throw new ValidationError(error.message)
                } finally {
                    await session.endSession();
                }

            }
        });
    }
    
    async Me(user) {
        if (!user) throw new ValidationError("Invalid user logged in");
        if (!user.id || !ObjectId.isValid(user.id)) throw new ValidationError("Invalid user ID");
        if (!user.user_type || !user.role) throw new ValidationError("Invalid token payload");

        const id = new ObjectId(user.id);

        if (user.user_type === "admin") {
            const allowed = ["admin", "staff", "superadmin"];
            if (!allowed.includes(user.role)) throw new ValidationError("Forbidden");
            return await AdminModel.viewAdmin(id);
        }

        if (user.user_type === "member") {
            if (user.role !== "member") throw new ValidationError("Forbidden");
            return await MemberModel.viewMember(id);
        }

        if (user.user_type === "trainer") {
            if (user.role !== "trainer") throw new ValidationError("Forbidden");
            return await TrainerManagementModel.findTrainerById(id);
        }

        throw new ValidationError("No user found");
    }

    async SingleSourceOfTruth(user) {
    
        if (!user) throw new ValidationError("Invalid member logged in");

        if (!user.id || !ObjectId.isValid(user.id)) throw new ValidationError("Invalid member ID");

        const id = new ObjectId(user.id);

        const membership_request = await MembershipRequestModel.findMembershipRequestByMemberId(id);

        const discount_request = await DiscountRequestModel.findDiscountRequestByMembershipRequestId(membership_request._id);

        const plan = await PlanModel.viewAPlan(new ObjectId(membership_request.plan_id));

        const pricing = await PricingModel.getPricing(new ObjectId(membership_request.pricing_id));

        const membership = await MembershipModel.findMembershipByMemberId(id);

        const result = {
            user: {
                id: user.id,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                role: user.role,
                user_type: user.user_type,
                member_type: user.member_type
            },
            discount_request: discount_request ? {
                id: discount_request._id,
                status: discount_request.status,
                reviewed_by: discount_request.reviewed_by,
                reviewed_at: discount_request.reviewed_at,
            } : null,
            membership_request: membership_request ? {
                id: membership_request._id,
                status: membership_request.status,
                member_type: membership_request.member_type,
                request_type: membership_request.request_type
            } : null,
            plan: plan ? {
                id: plan._id,
                name: plan.name,
                label: plan.label,
            } : null,
            pricing: pricing ? {
                id: pricing._id,
                name: pricing.name,
                label: pricing.label,
                price: pricing.price,
                duration_days: pricing.duration_days,
                membership_fee: pricing.membership_fee,
            } : null,
            membership: membership ? {
                id: membership._id,
                start_date: membership.start_date,
                end_date: membership.end_date,
                status: membership.status,
                member_type: membership.member_type,
                is_frozen: membership.is_frozen,
                frozen_at: membership.frozen_at,
                frozen_til: membership.frozen_til
            } : null
        }
        return result;
    }
}

export default new AuthService();