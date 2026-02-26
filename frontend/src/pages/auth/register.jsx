import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, User, Phone, Dumbbell } from "lucide-react";
import api from "../../api/axios.js";
import { motion } from "framer-motion";
import LoadingSpinner from "../../components/LoadingSpinner.jsx";
import { useAuth } from "../../context/AuthContext.jsx";


export default function Register() {
    const navigate = useNavigate();
    const [message, setMessage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showConfirmPass, setShowConfirmPass] = useState(false);
    const [showPass, setShowPass] = useState(false);
    const [formData, setFormData] = useState({
        first_name: "", last_name: "", email: "", phone: "", password: "", confirmPassword: "", plan_id: "", pricing_id: "", member_type: ""
    });
    
    // Get plan from URL query params
    const searchParams = new URLSearchParams(window.location.search);
    const planIdFromUrl = searchParams.get('plan_id');
    const priceIdFromUrl = searchParams.get('price_id');
    const memberTypeFromUrl = searchParams.get('member_type');
    
    const [showPlanMessage, setShowPlanMessage] = useState(false);
    
    useEffect(() => {
        if (!planIdFromUrl) {
            setShowPlanMessage(true);
            navigate("/#membership", { replace: true });
        }
    }, [planIdFromUrl]);

    useEffect(() => {
      if(planIdFromUrl) {
        setFormData((prev) => ({
          ...prev,
          plan_id: planIdFromUrl,
          pricing_id: priceIdFromUrl,
          member_type: memberTypeFromUrl
        }));
      }
    }, [planIdFromUrl, priceIdFromUrl, memberTypeFromUrl]);

    const { register, isAuthenticated, setIsAuthenticated } = useAuth();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    }

    const redirectAfter = (ms) => new Promise(res => setTimeout(res, ms));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        if(!formData.first_name || !formData.last_name || !formData.email || !formData.phone || !formData.password || !formData.confirmPassword) {
            setMessage("Please fill out all required fields!");
            setLoading(false);
            return;
        }

        if(!planIdFromUrl) {
          setMessage("Please select a membership plan!");
          setLoading(false);
          return;
        }

        if(formData.password !== formData.confirmPassword) {
            setMessage("Passwords do not match!");
            setLoading(false);
            return;
        }

        try {
            const request = await register(formData)

            setMessage(request.message);
            await redirectAfter(1000);
            setLoading(false);

            if(request.redirectedPath) {
              navigate(request.redirectedPath);
              setIsAuthenticated(true);
            } else {
              navigate("/member/dashboard");
              setIsAuthenticated(true);
            }

        } catch (error) {
            setMessage(error.response?.data?.message || "Registration failed");
            console.error("Error Registering: ", error.message);
            setLoading(false);
        }
    }
    return (
    <motion.div 
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, ease: "easeOut" }}
    className="min-h-screen flex">
        {loading && <LoadingSpinner />}
        
      {/* Left (Info Panel) - Red Gradient */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-red-900 via-red-800 to-black text-white items-center justify-center p-10">
        <div className="max-w-md text-center">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8 justify-center">
            <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center">
              <Dumbbell className="w-10 h-10 text-white" />
            </div>
          </div>
          
          <h2 className="text-3xl font-bold mb-6">JOIN 6Pack Iron City</h2>
          <p className="text-lg mb-6 text-gray-300">
            "Over 15K+ members trust our gym membership services. Become part of something big, and grow with us."
          </p>
         
          <div className="flex items-center justify-center gap-3 mb-8">
            <img src="../../public/icons/6pack.jpg" alt="User" className="w-12 h-12 rounded-full border-2 border-red-500" />
            <div className="text-left">
              <p className="font-semibold">Shin Yamauchi</p>
              <p className="text-gray-400 text-sm">6Pack Iron City Gym</p>
            </div>
          </div>
          
          {/* Benefits */}
          <div className="space-y-3 text-left mt-8">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center text-xs">✓</div>
              <span className="text-gray-300">Modern Equipment</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center text-xs">✓</div>
              <span className="text-gray-300">Expert Personal Trainers</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center text-xs">✓</div>
              <span className="text-gray-300">24/7 Access</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center text-xs">✓</div>
              <span className="text-gray-300">Group Classes</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right (Form) - Black Background */}
      <div className="flex-1 flex items-center justify-center p-8 bg-black">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8 justify-center">
            <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center">
              <Dumbbell className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold tracking-wider">6Pack Iron City</span>
          </div>

          <h2 className="text-3xl font-bold text-white mb-4 text-center">Create Account</h2>
          <p className="text-gray-400 mb-8 text-center">Start your fitness journey with us</p>
           
           {message && (
            <p className="mb-4 text-sm text-red-400 bg-red-900/30 border border-red-600 p-3 rounded-lg">
                {message}
            </p>
            )}
            
          <form className="space-y-5" autoComplete="off" onSubmit={handleSubmit}>
            <div className="relative">
              <User className="absolute left-3 top-3 text-gray-500" size={18} />
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                autoComplete="off"
                placeholder="First Name"
                className="w-full pl-10 pr-4 py-3 border border-red-900 bg-black text-white rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
                required
              />
            </div>
            <div className="relative">
              <User className="absolute left-3 top-3 text-gray-500" size={18} />
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                autoComplete="off"
                placeholder="Last Name"
                className="w-full pl-10 pr-4 py-3 border border-red-900 bg-black text-white rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
                required
              />
            </div>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-gray-500" size={18} />
              <input
                type="email"
                name="email"
                autoComplete="off"
                value={formData.email}
                onChange={handleChange}

                placeholder="Email address"
                className="w-full pl-10 pr-4 py-3 border border-red-900 bg-black text-white rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
                required
              />
            </div>
            <div className="relative">
              <Phone className="absolute left-3 top-3 text-gray-500" size={18} />
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                autoComplete="off"
                placeholder="+63"
                className="w-full pl-10 pr-4 py-3 border border-red-900 bg-black text-white rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-500" size={18} />
              <input
                name="password"
                value={formData.password}
                onChange={handleChange}
                type={showPass ? "text" : "password"}
                autoComplete="off"
                placeholder="Password"
                className="w-full pl-10 pr-10 py-3 border border-red-900 bg-black text-white rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
                required
              />
              <div
                className="absolute right-3 top-3 cursor-pointer text-gray-500 hover:text-white"
                onClick={() => setShowPass(!showPass)}
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </div>
            </div>
            <div className="relative">
            <Lock className="absolute left-3 top-3 text-gray-500" size={18} />
            <input
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              type={showConfirmPass ? "text" : "password"}
              autoComplete="off"
              placeholder="Confirm Password"
              className="w-full pl-10 pr-10 py-3 border border-red-900 bg-black text-white rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
              required
            />
            <div
                className="absolute right-3 top-3 cursor-pointer text-gray-500 hover:text-white"
                onClick={() => setShowConfirmPass(!showConfirmPass)}
              >
                {showConfirmPass ? <EyeOff size={18} /> : <Eye size={18} />}
            </div>
            </div>
            <button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-bold transition"
            >
              Create Account
            </button>
          </form>

          <p className="mt-6 text-center text-gray-400">
            Already have an account?{" "}
            <Link to="/login" className="text-red-500 font-medium hover:underline">
              Sign In
            </Link>
          </p>
          
          {/* Back to Home */}
          <p className="mt-4 text-center">
            <Link to="/" className="text-gray-500 hover:text-white text-sm">
              ← Back to Home
            </Link>
          </p>
        </div>
      </div>
    </motion.div>
  );
}
