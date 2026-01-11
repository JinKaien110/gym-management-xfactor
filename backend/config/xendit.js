import axios from "axios";
import dotenv from "dotenv"

dotenv.config();

console.log("Using Xendit key:", process.env.XENDIT_SECRET_KEY?.slice(0, 10));


export const axiosInstance = axios.create({
    baseURL: "https://api.xendit.co",
    headers: {
        "Content-Type": "application/json",
    },
    auth: {
        username: process.env.XENDIT_SECRET_KEY,
        password: "", 
    },
});
