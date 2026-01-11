import dotenv from "dotenv";

dotenv.config();

export function verifyXenditWebhook(req, res, next) {
    const token = req.headers["x-callback-token"];

    if(!token) {
        return res.status(401).send("Missing callback token");
    }

    next();
}