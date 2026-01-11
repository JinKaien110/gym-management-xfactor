import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, User, Phone } from "lucide-react";
import api from "../../api/axios.js";
import { motion } from "framer-motion";
import LoadingSpinner from "../../components/LoadingSpinner.jsx";
import { useAuth } from "../../context/AuthContext.jsx";


export default function Register() {
    const [message, setMessage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showConfirmPass, setShowConfirmPass] = useState(false);
    const [showPass, setShowPass] = useState(false);
    const [formData, setFormData] = useState({
        name: "", email: "", phone: "", password: "", confirmPassword: ""
    });
    const { register } = useAuth();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        if(!formData.name || !formData.email || !formData.password || !formData.confirmPassword) return setMessage("Please fillout the necessary form!");
        try {
            const request = await register(formData)

            setMessage(request.data.message);
            setTimeout(() => {
        setLoading(false);
      }, 1000); 
            

        } catch (error) {
            setMessage(error.message);
            console.error("Error Registering: ", error.message);
        }
    }
    return (
    <motion.div 
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, ease: "easeOut" }}
    className="min-h-screen flex">
        {loading && <LoadingSpinner />}
      {/* Left (Info Panel) */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-pink-600 to-red-600 text-white items-center justify-center p-10">
        <div className="max-w-md text-center">
          <h2 className="text-3xl font-bold mb-6">Join Our Members</h2>
          <p className="text-lg italic mb-6">
            "Over 15k+ members trust our gym membership services. Become part of something big, and grow with us."
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

      {/* Right (Form) */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Create Account</h2>
          <p className="text-gray-600 mb-8">Sign up to get started and enjoy our services.</p>
           {message && (
            <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded-lg">
                {message}
            </p>
            )}
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="relative">
              <User className="absolute left-3 top-3 text-gray-400" size={18} />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Full Name"
                className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500"
              />
            </div>
            <div className="relative">
              <Mail className="absolute left-3 top-4 text-gray-400" size={18} />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email"
                className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500"
              />
            </div>
            <div className="relative">
              <Phone className="absolute left-3 top-4 text-gray-400" size={18} />
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+63 "
                className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
              <input
                name="password"
                value={formData.password}
                onChange={handleChange}
                type={showPass ? "text" : "password"}
                placeholder="Password"
                className="w-full pl-10 pr-10 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500"
              />
              <div
                className="absolute right-3 top-3 cursor-pointer text-gray-400"
                onClick={() => setShowPass(!showPass)}
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </div>
            </div>
            <div className="relative">
            <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              type={showConfirmPass ? "text" : "password"}
              placeholder="Confirm Password"
              className="w-full pl-10 pr-10 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500"
            />
            <div
                className="absolute right-3 top-3 cursor-pointer text-gray-400"
                onClick={() => setShowConfirmPass(!showConfirmPass)}
              >
                {showConfirmPass ? <EyeOff size={18} /> : <Eye size={18} />}
            </div>
            </div>
            <button
              type="submit"
              className="w-full bg-pink-600 text-white py-3 rounded-lg hover:bg-pink-700 transition"
            >
              Sign Up
            </button>
          </form>

          <p className="mt-6 text-center text-gray-600">
            Already have an account?{" "}
            <a href="/login" className="text-pink-600 font-medium hover:underline">
              Login
            </a>
          </p>
        </div>
      </div>
    </motion.div>
  );
}