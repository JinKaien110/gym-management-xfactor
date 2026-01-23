import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { generateToken } from "../utils/generateToken.js";
import AuthModel from "../models/AuthModel.js";
import MemberModel from "../models/MemberModel.js";
import TrainerManagementModel from "../models/TrainerManagementModel.js";


dotenv.config();

class AuthController {
    async loginUser(req, res) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(401).json({ message: "Please fill out the necessary field." });
            }

            const sanitizedEmail = String(email).trim().toLowerCase();
            const sanitizedPassword = String(password).trim();

            const [member, trainer] = await Promise.all([
                AuthModel.FindUserByEmail(sanitizedEmail),
                TrainerManagementModel.findTrainerByEmail(sanitizedEmail),
            ]);

            
            const account = member || trainer;
            
            if (!account) {
                return res.status(401).json({ message: "No user found." });
            }

            const isPasswordMatch = await AuthModel.ValidatePassword(
                sanitizedPassword,
                account.password
            );

            if (!isPasswordMatch) {
                return res.status(401).json({ message: "Incorrect password." });
            }

            // 3) Generate token from the same account
            const token = generateToken({
                id: account._id,
                first_name: account.first_name,
                last_name: account.last_name,
                email: account.email,
                role: account.role, 
            });

            // 4) Cookie config (your secure flag is reversed)
            res.cookie("token", token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                maxAge: 60 * 60 * 1000,
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

            return res.status(200).json({
                message: "Login successfully",
                user: userPayload,
            });
            } catch (error) {
            console.error("LOGIN ERROR:", {
    name: error?.name,
    message: error?.message,
    code: error?.code,
    stack: error?.stack
  });

  return res.status(500).json({
    message: "Server error",
    error: {
      name: error?.name,
      message: error?.message,
      code: error?.code
    }
  });
            }

    }

    async RegisterUser(req, res) {
        try {

            const { email, first_name, last_name, phone, password } = req.body;
            if(!email || !password || !first_name || !last_name || !phone) {
                return res.status(401).json({ message: "Please fillout the necessary field."});
            }
            
            const sanitized = {
                first_name: first_name?.trim(),
                last_name: last_name.trim(),
                email: email?.trim().toLowerCase(),
                phone: phone.trim(),
                address: null,
                password: password?.trim(),
                role: "member",
                status: "active",
                member_type: null,
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
            if(UserExist) return res.status(401).json({ message: "User already existed."});

            const SuccessRegister = await MemberModel.RegisterUser({
                ...sanitized
            });


            if(!SuccessRegister) return res.status(401).json({ message: "Failed to register."});

            return res.status(201).json({
                message: "User registered successfully!",
                UserId: SuccessRegister.insertedId
            });

        } catch (error) {
            return res.status(500).json({ message: "Server Error: ", error });
        }
    }

    async Logout(req, res) {
        try {
            res.clearCookie("token", {
                httpOnly: true,
                secure: process.env.NODE_ENV === "development",
                sameSite: "strict"
            });

            return res.status(200).json({ message: "Logged out successfully!"});
        } catch (error) {
            console.error("Server Error: ", error.message)
            return res.status(500).json({ message: "Server Error: ", error: error.message})
        }
    }

    async Me(req, res) {
        try {
            const user = await MemberModel.FindUserById(req.user.id);

            if(!user) return res.status(404).json({ message: "User not found"});

            return res.status(200).json(user);
        } catch (error) {
            res.status(500).json({ message: "Server error" });
        }
    }
}

export default new AuthController();