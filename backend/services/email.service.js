import axios from "axios"
import dotenv from "dotenv"
dotenv.config()

export async function sendEmail({ to, subject, html }) {
    const apiKey = process.env.BREVO_API_KEY;

    if(!apiKey) {
        throw new Error("BREVO_API_KEY is missing")
    }

    const payload = {
        sender: {
            email: process.env.EMAIL_FROM,
            name: process.env.EMAIL_FROM_NAME || "Gym System"
        },
        to: [{ email: to }],
        subject,
        htmlContent: html
    };

    const response = await axios.post(
        "https://api.brevo.com/v3/smtp/email",
        payload,
        {
            headers: {
                "api-key": apiKey,
                "Content-Type": "application/json"
            }
        }
    );

    return response.data
}