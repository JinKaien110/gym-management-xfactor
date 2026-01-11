import { useState } from "react";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "../../../src/styles/auth.css";
import api from "../../api/axios.js";
import { motion } from "framer-motion";
import LoadingSpinner from "../../components/LoadingSpinner.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

export default function Login() {
    const navigate = useNavigate();
    const [showPass, setShowPass] = useState(false);
    const [message, setMessage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({ email: "", password: ""});
    const { user, setUser, login, logout } = useAuth();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const request = await login(formData);
            
            

           const role = request.data.user.role;
        if (role === "member") navigate("/member/dashboard");
        if (role === "superadmin") navigate("/postform");
            setMessage(request.data.message);
            setTimeout(() => {
              setLoading(false);
            }, 1000); 

        } catch (error) {
            setMessage("Login failed", error.message);
            console.log("Login failed", error.message);
        }
    }
    return (
    <motion.div 
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, ease: "easeOut" }}
    className="min-h-screen flex">
      {/* Left (Form) */}
      {loading && <LoadingSpinner />}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Welcome Back!</h2>
          <p className="text-gray-600 mb-8">
            Sign in to access your dashboard and continue optimizing your process.
          </p>
          
            {message && (
            <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded-lg">
                {message}
            </p>
            )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
              <input
                name="password"
                value={formData.password}
                onChange={handleChange}
                type={showPass ? "text" : "password"}
                placeholder="Enter your password"
                className="w-full pl-10 pr-10 py-3 border rounded-lg focus:ring-2 focus:ring-teal-500"
              />
              <div
                className="absolute right-3 top-3 cursor-pointer text-gray-400"
                onClick={() => setShowPass(!showPass)}
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </div>
            </div>
            <div className="text-right">
              <a href="#" className="text-sm text-teal-600 hover:underline">
                Forgot Password?
              </a>
            </div>
            <button
              type="submit"
              className="w-full bg-teal-600 text-white py-3 rounded-lg hover:bg-teal-700 transition"
            >
              Sign In
            </button>
          </form>

          <div className="mt-6 flex items-center gap-2">
            <div className="h-px bg-gray-300 flex-1"></div>
            <span className="text-sm text-gray-400">OR</span>
            <div className="h-px bg-gray-300 flex-1"></div>
          </div>

          <div className="mt-4 space-y-3">
            <button className="w-full flex items-center justify-center gap-2 border py-3 rounded-lg hover:bg-gray-50">
              <img src="https://www.svgrepo.com/show/355037/google.svg" alt="Google" className="w-5 h-5" />
              Continue with Google
            </button>
            <button className="w-full flex items-center justify-center gap-2 border py-3 rounded-lg hover:bg-gray-50">
              <img src="https://www.svgrepo.com/show/303128/apple-logo.svg" alt="Apple" className="w-5 h-5" />
              Continue with Apple
            </button>
          </div>

          <p className="mt-6 text-center text-gray-600">
            Don’t have an account?{" "}
            <a href="/register" className="text-teal-600 font-medium hover:underline">
              Sign Up
            </a>
          </p>
        </div>
      </div>

      {/* Right (Info Panel) */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-teal-700 to-teal-900 text-white items-center justify-center p-10">
        <div className="max-w-md text-center">
          <h2 className="text-3xl font-bold mb-6">What is Lorem Ipsum?</h2>
          <p className="text-lg italic mb-6">
            "A common form of Lorem ipsum reads: Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."
          </p>
          <div className="flex items-center justify-center gap-3">
            <img src="../../public/icons/xfactor.jpg" alt="User" className="w-10 h-10 rounded-full" />
            <div className="text-sm">
              <p className="font-semibold">Shin Yamauchi</p>
              <p className="text-gray-300">X-Factor Fitness Gym Trece</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}