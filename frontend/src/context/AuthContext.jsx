import { createContext, useContext, useState, useEffect } from "react";
import api from "../api/axios.js";
import { Navigate, useNavigate } from "react-router-dom";

const AuthContext = createContext();
const publicPaths = ["/login", "/register"];


export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const navigate = useNavigate();

    // Initialize user on mount - this was missing!
    useEffect(() => {
        fetchUser();
    }, []);

     async function fetchUser() {
         // Only show loading for the initial check to prevent UI flickering during background refreshes
         if (!user) setLoading(true);
         try {
             const request = await api.get("/auth/me");
             const data = request.data;
             setUser(data);
             setIsAuthenticated(true);
         } catch (err) {
             // Only clear authentication if the session is actually invalid
             if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                console.log("Session invalid or expired. Logging out.");
                 setUser(null);
                 setIsAuthenticated(false);
             }
             console.error("Auth verification failed:", err.message);
         } finally {
             setLoading(false)
         }
     }


    async function logout() {
        await api.post("/auth/logout");
        setUser(null);
        setIsAuthenticated(false);
        return;
    }

    async function login(credentials) {
        const request = await api.post("/auth/login", credentials);
        const user = request.data.user;
        const message = request.data.message;
        setUser(request.data.user);
        setIsAuthenticated(true);
        console.log("Login successful", request.data);
        console.log("User data", user);
        
        if(user.user_type === "admin") {
            return {
                user,
                message,
                redirectedPath: "/admin/dashboard"
            }
        };
        if(user.user_type === "client") {
            return {
                user,
                message,
                redirectedPath: "/client/dashboard"
            }
        };
        if(user.user_type === 'trainer') {
            return {
                user,
                message,
                redirectedPath: "/trainer/dashboard"
            }
        }

        return {
            user,
            message
        }

    }

    async function register(credentials) {
        const request = await api.post("/register", credentials);
        const user = request.data.user;
        const login = await api.post("/auth/login", credentials);
        const message = request.data.message;
        setUser(login.data.user);
        setIsAuthenticated(true);
        
        return {
            user,
            message,
            redirectedPath: "/client/membership"
        }
    }

    async function progressCheck(user) {
        const progress = await api.get("/auth/ssot");
        if (!user || !progress) return;
        const data = progress.data;

        const discount_request = data.discount_request ?? null;
        const payment = data.payment ?? null;
        const pricing = data.pricing ?? null;
        const client_pass = data.client_pass ?? null;

        const hasActivePass = client_pass && client_pass.status === "active";

        // NO ACTIVE PASS → onboarding flow
        if (!hasActivePass) {

            // 1️ Discounted pricing → go to discount request (if not yet submitted or still pending)
            if (
                pricing?.type === "discounted" &&
                payment?.payment_for === "daily_pass" &&
                (!discount_request || discount_request?.status !== "pending") &&
                payment?.status !== "PAID"
            ) {
                setUser(user);
                setIsAuthenticated(true);
                return "/client/discount-request";
            }

            // 2️ Discount processed → go to payment
            if (
                pricing?.type === "discounted" &&
                discount_request &&
                (discount_request.status === "approved" || discount_request.status === "rejected") &&
                payment?.status !== "PAID"
            ) {
                setUser(user);
                setIsAuthenticated(true);
                return "/client/payment";
            }

            // 3️ Regular pricing (no discount) → go directly to payment
            if (
                pricing?.type !== "discounted" &&
                payment?.payment_for === "daily_pass" &&
                payment?.status !== "PAID"
            ) {
                setUser(user);
                setIsAuthenticated(true);
                return "/client/payment";
            }

            return;
        }

        // HAS ACTIVE PASS → check profile completeness
        const required = [
            "gender", "date_of_birth", "height", "weight",
            "bmi", "fitness_goal", "training_type",
            "experience_level", "days_per_week", "session_minutes"
        ];

        const incomplete = required.some(field => !user[field]);

        if (incomplete) {
            setUser(user);
            setIsAuthenticated(true);
            return "/client/postform";
        }

        return;
    }

    return (
        <AuthContext.Provider value={{ user, loading, register, logout, login, isAuthenticated, setIsAuthenticated, fetchUser, setUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);