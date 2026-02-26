import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";

export default function ProtectedRoute({  allowedUserTypes = [], allowedRoles = [] }) {
    const { user, loading } = useAuth();

    if(loading) return <LoadingSpinner />

    if(!user) return <Navigate to="/login" />;
    // console.log(user)
    
    if(!allowedUserTypes.includes(user.user_type)) return <Navigate to="/unauthorized" replace />;

    if(!allowedRoles.includes(user.role)) return <Navigate to="/unauthorized" replace />;


    return <Outlet />
}