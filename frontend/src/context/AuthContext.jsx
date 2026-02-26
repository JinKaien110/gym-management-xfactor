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

    useEffect(() => {
        if(publicPaths.includes(window.location.pathname)) {
            setLoading(false);
            return;
        }
        async function fetchUser() {
            setLoading(true);
            try {
                const request = await api.get("/auth/me");
    
                setUser(request.data);
                setIsAuthenticated(true);
            } catch (err) {
                setUser(null);
                setIsAuthenticated(false);
            } finally {
                setLoading(false)
            }
        };
        fetchUser();
    }, []);

    async function logout() {
        await api.post("/auth/logout");
        setUser(null);
        setIsAuthenticated(false);
    }

    async function login(credentials) {
        const request = await api.post("/auth/login", credentials);
        const user = request.data.user;
        const message = request.data.message;
        setUser(request.data.user);
        setIsAuthenticated(true);
        

        if(user.user_type === "admin") {
            const redirectedPath = "/admin/dashboard";
            console.log(redirectedPath)
            return {
                user,
                message,
                redirectedPath
            }
        };
        const redirectedPath = await progressCheck(user);
                console.log(redirectedPath)
        return {
            user,
            message,
            redirectedPath
        }

    }

    async function register(credentials) {
        const request = await api.post("/register", credentials);
        
        const user = request.data.user;
        await login(credentials);
        const message = request.data.message;

        setUser(request.data.user);

        const redirectedPath = await progressCheck(user);
        console.log(redirectedPath)

        return {
            user,
            message,
            redirectedPath
        }
    }

    async function progressCheck(user) {

        const progress = await api.get("/auth/ssot");
        console.log(progress)
        if(!user || !progress) return;

        const discount_request = progress.data.discount_request ?? null;
        const membership_request = progress.data.membership_request ?? null;
        const membership = progress.data.membership ?? null;

        if(user.member_type === "pending") {
            if(membership_request.status === "pending_discount_review" && membership_request.request_type === "creation") {
                if(!discount_request) {
                    setUser(user);
                    setIsAuthenticated(true);
                    return "/member/discount-request";
                }
                if(discount_request.status === "submitted" && membership_request.member_type === "discounted") {
                    setUser(user);
                    setIsAuthenticated(true);
                    return "/member/discount-request";
                }
            }
            
            else if((membership_request.member_type === "regular" && membership_request.request_type === "creation") || membership_request.member_type === "discounted") {
                if(!discount_request || membership_request.status === "ready_for_payment") {
                    setUser(user);
                    setIsAuthenticated(true);
                    return "/member/payment";
                }
            } else if(  membership_request.request_type === "creation" && discount_request.status === "approved") {
                
                if(membership_request.status === "ready_for_payment") {
                    setUser(user);
                    setIsAuthenticated(true);
                    return "/member/payment";
                }
            }
        } else {
            const required = ["gender", "date_of_birth", "height", "weight", "bmi", "fitness_goal", "training_type", "experience_level", "days_per_week", "session_minutes"];
            const incomplete = required.some(field => !user[field]);

            if (incomplete) {
                setUser(user);
                setIsAuthenticated(true)    ;
                return "/member/postform";
            }

            return;
        }
    }

    return (
        <AuthContext.Provider value={{ user, loading, register, logout, login, isAuthenticated, setIsAuthenticated, progressCheck }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);