import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";
import { motion } from "framer-motion";
import { CreditCard, ArrowLeft, CheckCircle, AlertCircle, Phone, Wallet, Loader } from "lucide-react";

export default function PaymentForm() {
  const { user, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    membership_request_id: "",
    amount: "",
    payment_method: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
  if (!isAuthenticated) return;

  const preparePayment = async () => {
    try {
      const result = await api.get("/auth/ssot");
      const data = result.data;

      if (!data?.membership_request) {
        navigate("/member/dashboard");
        return;
      }

      let membership_fee = 0;
      let price = data.pricing?.price || 0;

      if (data.membership_request.request_type === "creation") {
        membership_fee = 1000;
      }

      const amount = membership_fee + price;

      setFormData(prev => ({
        ...prev,
        membership_request_id: data.membership_request.id,
        amount
      }));

    } catch (err) {
      setError("Failed to prepare payment.");
    }
  };

  preparePayment();

}, [isAuthenticated, navigate]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setMessage(null);

    if (!formData.payment_method) {
      setError("Please fill in all fields");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await api.post("/payments/create", formData);
      
      setPaymentSuccess(true);
      setMessage("Payment initiated successfully! Redirecting...");
      
      // If there's a payment URL, redirect to it
      if (response.data.checkout_url) {
        window.location.href = response.data.checkout_url;
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to process payment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-2xl mx-auto"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <button
            onClick={() => navigate("/member/dashboard")}
            className="inline-flex items-center text-gray-400 hover:text-red-500 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </button>
          
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center">
              <CreditCard className="w-8 h-8 text-white" />
            </div>
          </div>
          
          <h1 className="text-3xl font-bold mb-2">Complete Payment</h1>
          <p className="text-gray-400">
            Secure your gym membership with a quick and easy payment
          </p>
        </div>

        {/* Success Message */}
        {paymentSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-green-900/30 border border-green-600 rounded-xl p-6 mb-6"
          >
            <div className="flex items-start gap-4">
              <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-green-400 mb-2">Payment Initiated!</h3>
                <p className="text-gray-300">{message}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-red-900/30 border border-red-600 rounded-xl p-6 mb-6"
          >
            <div className="flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-400 mb-2">Error</h3>
                <p className="text-gray-300">{error}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Payment Form */}
        {!paymentSuccess && (
          <form onSubmit={handleSubmit} className="bg-zinc-900/50 border border-red-600/30 rounded-2xl p-8">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-red-500" />
              Payment Details
            </h2>

            {/* Amount */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Amount (PHP) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">₱</span>
                <input
                  type="text"
                  value={formData.amount ? `₱${formData.amount}` : '₱0.00'}
                  readOnly
                  className="w-full bg-zinc-800 border border-red-600/30 rounded-xl pl-8 pr-4 py-4 text-white font-semibold"
                />
              </div>
            </div>

            {/* Payment Method */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Payment Method <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-4">
                {/* GCash */}
                <label
                  className={`cursor-pointer border-2 rounded-xl p-4 flex flex-col items-center gap-2 transition-all ${
                    formData.payment_method === "gcash"
                      ? "border-blue-500 bg-blue-900/20"
                      : "border-red-600/30 hover:border-red-500 bg-black/50"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="gcash"
                    checked={formData.payment_method === "gcash"}
                    onChange={() =>
                    setFormData(prev => ({ ...prev, payment_method: "gcash" }))
                    }
                    className="hidden"
                  />
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                    <Phone className="w-6 h-6 text-white" />
                  </div>
                  <span className="font-semibold">GCash</span>
                </label>

                {/* PayMaya */}
                <label
                  className={`cursor-pointer border-2 rounded-xl p-4 flex flex-col items-center gap-2 transition-all ${
                    formData.payment_method === "paymaya"
                      ? "border-blue-600 bg-blue-900/20"
                      : "border-red-600/30 hover:border-red-500 bg-black/50"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment_method"
                    value="paymaya"
                    checked={formData.payment_method === "paymaya"}
                    onChange={() =>
                        setFormData(prev => ({ ...prev, payment_method: "paymaya" }))
                    }
                    className="hidden"
                  />
                  <div className="w-12 h-12 bg-blue-700 rounded-full flex items-center justify-center">
                    <Wallet className="w-6 h-6 text-white" />
                  </div>
                  <span className="font-semibold">PayMaya</span>
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || !formData.payment_method}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                isSubmitting ||  !formData.payment_method
                  ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                  : "bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/25 hover:shadow-red-600/40"
              }`}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader className="w-5 h-5 animate-spin" />
                  Processing Payment...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Pay ₱{formData.amount || "0.00"}
                </span>
              )}
            </button>
          </form>
        )}

        {/* Security Note */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>🔒 Your payment is secured by Xendit</p>
          <p className="mt-2">Need help? Contact us at <span className="text-red-500">info@6packironcity.com</span></p>
        </div>
      </motion.div>
    </div>
  );
}
