import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle, ArrowRight } from "lucide-react";

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const paymentFor = searchParams.get('payment_for');

  useEffect(() => {
    // Determine redirect path based on payment_for
    let redirectPath = "/client/dashboard";
    
    if (paymentFor === "daily_pass") {
      redirectPath = "/client/postform";
    } else if (paymentFor === "membership") {
      redirectPath = "/client/membership";
    } else if (paymentFor === "trainer-booking") {
      redirectPath = "/client/dashboard";
    }

    // Redirect after 3 seconds
    const timer = setTimeout(() => {
      navigate(redirectPath);
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate, paymentFor]);

  // Determine redirect path for display and button
  const getRedirectPath = () => {
    if (paymentFor === "daily_pass") return "/client/postform";
    if (paymentFor === "membership") return "/client/membership";
    return "/client/dashboard";
  };

  const getRedirectLabel = () => {
    if (paymentFor === "daily_pass") return "Post Form";
    if (paymentFor === "membership") return "membership";
    if (paymentFor === "trainer-booking") return "Dashboard";
    return "Dashboard";
  };

  const getMessage = () => {
    if (paymentFor === "daily_pass") {
      return "Thank you for your payment. Please complete your profile to continue.";
    }
    if (paymentFor === "membership") {
      return "Thank you for your payment. Your membership is being processed.";
    }
    if (paymentFor === "trainer-booking") {
      return "Thank you for your payment. Your trainer booking is confirmed.";
    }
    return "Thank you for your payment.";
  };

  const redirectPath = getRedirectPath();

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-24 h-24 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <CheckCircle className="w-12 h-12 text-white" />
        </motion.div>

        <h1 className="text-3xl font-bold mb-4 text-green-500">Payment Successful!</h1>
        
        <p className="text-gray-400 mb-8">
          {getMessage()}
        </p>

        <div className="bg-zinc-900/50 border border-green-600/30 rounded-xl p-6 mb-8">
          <p className="text-sm text-gray-400 mb-2">Redirecting you to {getRedirectLabel().toLowerCase()}...</p>
          <p className="text-green-500 font-semibold">{getRedirectLabel()}</p>
        </div>

        <button
          onClick={() => navigate(redirectPath)}
          className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-colors"
        >
          Continue Now
          <ArrowRight className="w-4 h-4" />
        </button>
      </motion.div>
    </div>
  );
}
