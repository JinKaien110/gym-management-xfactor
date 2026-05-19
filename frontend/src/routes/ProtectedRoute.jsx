import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";

export default function ProtectedRoute({  allowedUserTypes = [], allowedRoles = [] }) {
    const { user, loading, isAuthenticated } = useAuth();


    if (loading || isAuthenticated === null) {
    return <LoadingSpinner />;
}

    if(!user) return <Navigate to="/login" />;
    
    // Now that AuthContext is consistent, we can read directly from user=
    const userType = user?.user?.user_type ?? user.user_type;
    const userRole = user?.user?.role ?? user.role;
    
    // Only redirect if allowedUserTypes is provided AND the user doesn't match
    if (allowedUserTypes.length > 0 && !allowedUserTypes.includes(userType)) {
        return <Navigate to="/unauthorized" replace />;
    }

    // Only redirect if allowedRoles is provided AND the user doesn't match
    if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
        return <Navigate to="/unauthorized" replace />;
    }

    

    return <Outlet />
}