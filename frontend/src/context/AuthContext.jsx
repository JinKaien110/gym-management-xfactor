import { createContext, useContext, useState, useEffect } from "react";
import api from "../api/axios.js";

const AuthContext = createContext();
const publicPaths = ["/login", "/register"];

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

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
        setUser(request.data.user);
        setIsAuthenticated(true);
        return request;
    }

    async function register(credentials) {
        const request = await api.post("/register", credentials);
        return request;
    }

    return (
        <AuthContext.Provider value={{ user, loading, register, logout, login, isAuthenticated }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);