import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";

export default function PublicRoute() {
    const { user, loading } = useAuth();

    if(loading) return <LoadingSpinner />

    if (user) {
        const required = ["gender", "age", "height", "weight", "bmi", "fitness_goal"];
        const incomplete = required.some(field => !user[field]);
        if (incomplete && window.location.pathname !== "/postform") {
            return <Navigate to="/postform" replace />;
        }
            
        return <Navigate to="/member/dashboard" replace />;
    }

    return <Outlet />;
}