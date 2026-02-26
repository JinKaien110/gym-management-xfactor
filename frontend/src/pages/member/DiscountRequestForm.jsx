import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Upload, CheckCircle, AlertCircle, ArrowLeft, User, CreditCard, Clock, X } from "lucide-react";

export default function DiscountRequestForm() {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const data = location.state;
  
  const [selfiePreview, setSelfiePreview] = useState(null);
  const [idPreview, setIdPreview] = useState(null);
  const [selfieUrl, setSelfieUrl] = useState("");
  const [idUrl, setIdUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [existingRequest, setExistingRequest] = useState(null);
  const [isReviewState, setIsReviewState] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/login");
    }
  }, [loading, isAuthenticated, navigate]);

  // Check if user has existing pending discount request
  useEffect(() => {
  if (!isAuthenticated) return;

  const fetchExistingRequest = async () => {
      try {
        // First check navigation state
        if (data?.discountRequest?.status === "submitted") {
          setExistingRequest(data.discountRequest);
          setIsReviewState(true);

        }

        if(data?.membership) {
          navigate("/member/dashboard");
        }

        if (
          data?.discount_request &&
          (data.discount_request.status === "approved" ||
          data.discount_request.status === "rejected")
        ) {
          navigate("/member/payment", { replace: true });
        }

        // Otherwise fetch fresh data
        const response = await api.get("/auth/ssot");

        const discount = response.data?.discount_request;


        if (discount?.status === "submitted") {
          setExistingRequest(discount);
          setIsReviewState(true);
        }

        if (
          discount?.status === "approved" ||
          discount?.status === "rejected"
        ) {
          navigate("/member/payment", { replace: true });
        }

      } catch (err) {
        console.log("Error fetching existing discount request", err.message);
      }
    };

    fetchExistingRequest();

  }, [isAuthenticated, data, navigate]);

  const handleSelfieChange = (e) => {
    const file = e.target.files[0];
    if (file) {
       setSelfieUrl(file); 
       setSelfiePreview(URL.createObjectURL(file)); 
     };
  }

  const handleIdChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setIdUrl(file);
      setIdPreview(URL.createObjectURL(file)); 
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setMessage(null);

    if (!selfieUrl || !idUrl) {
        setError("Please upload both selfie and ID.");
        setIsSubmitting(false);
        return;
    }

    try {
        const formData = new FormData();
        formData.append("selfie_url", selfieUrl);
        formData.append("id_url", idUrl);
      const response = await api.post("/discount-request", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
      });
      
      setMessage("Discount request submitted successfully! We'll review your application and send you an email once it's processed.");
      setExistingRequest(response.data);
      setIsReviewState(true);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit discount request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle "Pay as regular instead" - cancel discount request and go to payment
  const handlePayRegularInstead = async () => {
    setIsCancelling(true);
    try {
      // Empty function - user can fill this with actual API call to cancel discount request
      console.log("Cancelling discount request and redirecting to payment...");
      
      // Close modal and navigate to payment page
      setShowConfirmModal(false);
      navigate("/member/payment");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to cancel discount request.");
    } finally {
      setIsCancelling(false);
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
          
          <h1 className="text-3xl font-bold mb-2">Discount Request</h1>
          <p className="text-gray-400">
            Submit your application for PWD, Student, or Senior Citizen discount
          </p>
        </div>

        {/* Info Cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="bg-red-900/20 border border-red-600/30 rounded-xl p-4 text-center">
            <User className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <h3 className="font-semibold text-white">PWD Discount</h3>
            <p className="text-sm text-gray-400">Persons with Disability</p>
          </div>
          <div className="bg-red-900/20 border border-red-600/30 rounded-xl p-4 text-center">
            <CreditCard className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <h3 className="font-semibold text-white">Student Discount</h3>
            <p className="text-sm text-gray-400">Valid ID Required</p>
          </div>
          <div className="bg-red-900/20 border border-red-600/30 rounded-xl p-4 text-center">
            <CreditCard className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <h3 className="font-semibold text-white">Senior Discount</h3>
            <p className="text-sm text-gray-400">60 years old and above</p>
          </div>
        </div>

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

        {/* Review Pending State */}
        {isReviewState && existingRequest && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-zinc-900/50 border border-red-600/30 rounded-2xl p-8 mb-6"
          >
            <div className="text-center">
              <div className="w-20 h-20 bg-yellow-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Clock className="w-10 h-10 text-yellow-500" />
              </div>
              
              <h2 className="text-2xl font-bold mb-4">Please Wait for Review...</h2>
              
              <p className="text-gray-400 mb-6">
                Your discount request is currently being reviewed by our team. 
                We'll send you an email once the review is complete.
              </p>

              <div className="bg-black/50 rounded-xl p-4 mb-6">
                <p className="text-sm text-gray-400 mb-2">Application Status</p>
                <p className="text-yellow-500 font-semibold capitalize">{existingRequest.status}</p>
              </div>

              <div className="border-t border-red-600/30 pt-6">
                <p className="text-gray-400 mb-4">Want to proceed with regular pricing instead?</p>
                <button
                  onClick={() => setShowConfirmModal(true)}
                  className="px-6 py-3 bg-transparent border-2 border-red-600 hover:bg-red-600 text-red-500 hover:text-white rounded-xl font-semibold transition-all"
                >
                  Pay as Regular Price
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Form - Show when not in review state */}
        {!isReviewState && (
          <form onSubmit={handleSubmit} className="bg-zinc-900/50 border border-red-600/30 rounded-2xl p-8" >
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Camera className="w-5 h-5 text-red-500" />
              Upload Required Documents
            </h2>

            {/* Selfie Upload */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-300 mb-3">
                📸 Selfie Photo <span className="text-red-500">*</span>
              </label>
              <div className="border-2 border-dashed border-red-600/50 rounded-xl p-6 text-center hover:border-red-500 transition-colors">
                {selfiePreview ? (
                  <div className="relative">
                    <img
                      src={selfiePreview}
                      alt="Selfie Preview"
                      className="w-48 h-48 mx-auto rounded-lg object-cover border-2 border-red-600"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setSelfiePreview(null);
                        setSelfieUrl("");
                      }}
                      className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <Camera className="w-12 h-12 text-red-500 mx-auto mb-3" />
                    <p className="text-gray-400 mb-2">Take a selfie or upload a photo</p>
                    <label className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg cursor-pointer transition-colors">
                      <Upload className="w-4 h-4 mr-2" />
                      Choose File
                      <input
                        type="file"
                        id="selfieInput"
                        accept="image/*"
                        onChange={handleSelfieChange}
                        className="hidden"
                        required
                      />
                    </label>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Please take a clear photo of yourself holding your valid ID
              </p>
            </div>

            {/* ID Upload */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-300 mb-3">
                🪪 Valid ID <span className="text-red-500">*</span>
              </label>
              <div className="border-2 border-dashed border-red-600/50 rounded-xl p-6 text-center hover:border-red-500 transition-colors">
                {idPreview ? (
                  <div className="relative">
                    <img
                      src={idPreview}
                      alt="ID Preview"
                      className="w-48 h-48 mx-auto rounded-lg object-cover border-2 border-red-600"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setIdPreview(null);
                        setIdUrl("");
                      }}
                      className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <CreditCard className="w-12 h-12 text-red-500 mx-auto mb-3" />
                    <p className="text-gray-400 mb-2">Upload a photo of your valid ID</p>
                    <label className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg cursor-pointer transition-colors">
                      <Upload className="w-4 h-4 mr-2" />
                      Choose File
                      <input
                        type="file"
                        id="idInput"
                        accept="image/*"
                        onChange={handleIdChange}
                        className="hidden"
                        required
                      />
                    </label>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Accepted: PWD ID, Student ID, Senior Citizen ID, or government-issued IDs
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || !selfieUrl || !idUrl}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                isSubmitting || !selfieUrl || !idUrl
                  ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                  : "bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/25 hover:shadow-red-600/40"
              }`}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Submitting...
                </span>
              ) : (
                "Submit Discount Request"
              )}
            </button>
          </form>
        )}

        {/* Confirmation Modal */}
        <AnimatePresence>
          {showConfirmModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
              onClick={() => setShowConfirmModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-zinc-900 border border-red-600/50 rounded-2xl p-6 max-w-md w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-xl font-bold mb-4">Confirm Decision</h3>
                <p className="text-gray-400 mb-6">
                  Are you sure you want to proceed with regular pricing instead of the discounted rate? 
                  Your discount request will be cancelled.
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={() => setShowConfirmModal(false)}
                    className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePayRegularInstead}
                    disabled={isCancelling}
                    className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-50"
                  >
                    {isCancelling ? "Processing..." : "Yes, Pay Regular Price"}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer Info */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>Need help? Contact us at <span className="text-red-500">info@6packironcity.com</span></p>
        </div>
      </motion.div>
    </div>
  );
}
