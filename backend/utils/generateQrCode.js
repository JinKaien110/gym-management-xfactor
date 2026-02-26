import qrcode from "qrcode";
import crypto from "crypto";

export async function generateQrCode(id) {
    const qrToken = crypto
    .createHmac("sha256", process.env.QR_SECRET)
    .update(id.toString())
    .digest("hex");

    return qrToken;
}