import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";

export default function PublicRoute() {
    const { user, loading, progressCheck, isAuthenticated } = useAuth();
    const location = useLocation();

    if(loading) return <LoadingSpinner />

    if(isAuthenticated && user) {
        if(user.user_type === "admin") {
            return <Navigate to="/admin/dashboard" />
        } else if(user.user_type === "client") {
            return <Navigate to="/client/dashboard" />
        } else if(user.user_type === "trainer") {
            return <Navigate to="/trainer/dashboard" />
        } else if(location.pathname === "/register") {
            return <Navigate to="/client/membership" />
        }
        return <Navigate to="/" /> 
    }
        

    return <Outlet />;
}