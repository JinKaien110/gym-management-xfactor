/** import OpenAI from "openai";
import dotenv from "dotenv"

dotenv.config()

export const openrouter = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: process.env.OPENROUTER_BASE_URL,
    defaultHeaders: {
        "HTTP-Referer": "http://localhost", 
        "X-Title": "X-Factor Gym System",
    }
})
*/
