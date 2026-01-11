import qrcode from "qrcode";

export async function generateQrCode(id) {
    const QRData = id.toString();
    return await qrcode.toDataURL(QRData);
}