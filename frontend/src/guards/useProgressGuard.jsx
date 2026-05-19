import { useAuth } from "../context/AuthContext.jsx";
import { useLocation } from "react-router-dom";
import { useCallback } from "react";

export function useProgressGuard() {
    const { user } = useAuth();
    const location = useLocation();

    const checkProgress = useCallback(() => {
        const searchParams = new URLSearchParams(window.location.search);
        const planIdFromUrl = searchParams.get("plan_id");
        const pricingIdFromUrl = searchParams.get("pricing_id");
        const isPaymentForFromUrl = searchParams.get("payment_for");

        const { client_pass } = user || {};

        const hasActivePass = client_pass?.status === "active";
        const expiredActivePass = client_pass?.status === "expired";

        let result = null;

        if(expiredActivePass) {
            result = "/client/expired"
            return result;
        } 

        if(!hasActivePass) {
            console.log("User is trying to access payment page without query params, redirecting to daily pass");
            if(location.pathname === "/client/payment" && !planIdFromUrl && !pricingIdFromUrl && !isPaymentForFromUrl) {
                
                return '/client/daily-pass';
            }
        }

        return result;
    }, [user, location]);

    return { checkProgress };
}