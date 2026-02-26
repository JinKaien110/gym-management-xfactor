import axios from "axios"
import dotenv from "dotenv"
import { ValidationError } from "../errors/ValidationError.js";
dotenv.config()

export async function sendEmail({ to, subject, html }) {
    const apiKey = process.env.BREVO_API_KEY;

    if(!apiKey) {
        throw new ValidationError("BREVO_API_KEY is missing")
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
    try {
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
    } catch (error) {
        return;
    }
    

    return response.data
}