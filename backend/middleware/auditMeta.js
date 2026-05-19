import crypto from "crypto"

export function auditMeta(req, res, next) {
    req.auditMeta = {
        ip: (req.headers["x-forwarded-for"]?.split(",")[0] || "").trim() || req.socket?.remoteAddress || null,
        user_agent: req.headers["user-agent"] || null,
        request_id: req.headers["x-request-id"] || crypto.randomUUID(),
        method: req.method,
        path: req.originalUrl,
    };
    next()
}