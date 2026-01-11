import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import express from "express";

const app = express();
dotenv.config();
app.use(express.json());

export function verifyToken(req, res, next) {
    const token = req.cookies.token;

    if(!token) return res.status(400).json({ message: "Access denied. No token provided."});

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch {
        return res.status(403).json({ message: "Invalid or expired token."});
    }
}

export function authorizeRoles(...allowedRoles) {
    return (req, res, next) => {
        if(!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ message: "Forbidden: You do not have permission"});
        }
        next();
    } 
}