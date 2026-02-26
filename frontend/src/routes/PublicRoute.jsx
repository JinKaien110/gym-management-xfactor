import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";

export default function PublicRoute() {
    const { user, loading, progressCheck, isAuthenticated } = useAuth();

    if(loading) return <LoadingSpinner />

    if(user && isAuthenticated) return <Navigate to="/" /> 

    return <Outlet />;
}