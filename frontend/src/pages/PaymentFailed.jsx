import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { XCircle, ArrowLeft, RefreshCw } from "lucide-react";

export default function PaymentFailed() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to postform after 5 seconds
    const timer = setTimeout(() => {
      navigate("/postform");
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate]);

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
          className="w-24 h-24 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <XCircle className="w-12 h-12 text-white" />
        </motion.div>

        <h1 className="text-3xl font-bold mb-4 text-red-500">Payment Failed</h1>
        
        <p className="text-gray-400 mb-8">
          Unfortunately, your payment could not be processed. Please try again or contact support.
        </p>

        <div className="bg-zinc-900/50 border border-red-600/30 rounded-xl p-6 mb-8">
          <p className="text-sm text-gray-400 mb-2">You'll be redirected to try again...</p>
          <p className="text-red-500 font-semibold">/postform</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate("/client/payment")}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
          
          <button
            onClick={() => navigate("/client/dashboard")}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Go to Dashboard
          </button>
        </div>
      </motion.div>
    </div>
  );
}
