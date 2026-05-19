import { useEffect, useState } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import { useProgressGuard } from "./useProgressGuard.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";

export default function RequireProgress() {
    const { isAuthenticated } = useAuth();
    const { checkProgress } = useProgressGuard();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const runCheck = async () => {
            if (!isAuthenticated) {
                navigate('/login', { replace: true });
                return;
            }

            const redirect =  checkProgress();

            if (redirect) {

                navigate(redirect, { replace: true });
                return;
            }

            setLoading(false);
        };

        runCheck();
    }, [isAuthenticated, checkProgress, navigate]);

    if (loading) {
        return <LoadingSpinner />;
    }

    return <Outlet />;
}