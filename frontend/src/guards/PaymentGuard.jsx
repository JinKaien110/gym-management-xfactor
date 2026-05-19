import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useState } from "react";
import { useEffect } from "react";
import api from "../api/axios.js";
import LoadingSpinner from "../components/LoadingSpinner.jsx";


export default function PaymentGuard({ children }) {
    const { user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const searchParams = new URLSearchParams(location.search);
    const pricing_id = searchParams.get('pricing_id');
    const plan_id = searchParams.get('plan_id');
    const paymentFor = searchParams.get('payment_for');

    const [loading, setLoading] = useState(true);

     useEffect(() => {
         if(!user) return;
         
         // For membership payments without pricing_id, just allow access
         if(paymentFor === "membership") {
             setLoading(false);
             return;
         }

         if(paymentFor === "trainer-booking") {
            setLoading(false);
             return;
         }
         const isTheUserDiscounted = user?.user?.is_discounted ?? user?.is_discounted;
         
         let run = null;
        if(paymentFor === "daily_pass") {
            run = async () => {
                const res = await api.get(`/pricing/${pricing_id}`);
                if(res.data.type === "discounted" && isTheUserDiscounted) {
                    console.log(user)
                    navigate(`/client/payment?plan_id=${plan_id}&pricing_id=${pricing_id}&payment_for=${paymentFor}`);
                    
                }

                setLoading(false);
            };
        }

        run?.();
    }, [user, pricing_id]);
    

    if(loading) return <LoadingSpinner />

    return children;
}