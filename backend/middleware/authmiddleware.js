import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import express from "express";
import { ValidationError } from "../errors/ValidationError.js";

const app = express();
dotenv.config();
app.use(express.json());

export function verifyToken(req, res, next) {
    const token = req.cookies.token;

    if(!token) throw new ValidationError("Access denied. No token provided.");

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch {
        throw new ValidationError("Invalid or expired token.");
    }
}

export function authorizeRoles(...allowedRoles) {
    return (req, res, next) => {
        if(!req.user || !allowedRoles.includes(req.user.role)) {
            throw new ValidationError("Forbidden: You do not have permission");
        }
        next();
    } 
}