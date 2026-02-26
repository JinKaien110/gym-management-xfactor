// src/components/Navbar.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Dumbbell, Menu, X, LogOut, User } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../api/axios.js";

export default function Navbar({ scrollToPricing }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (err) {
      console.error("Logout error:", err);
    }
    logout();
    navigate("/");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-md border-b border-red-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center">
              <Dumbbell className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-wider">6Pack Iron City</span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-gray-300 hover:text-red-500 transition">Features</a>
            <a href="#membership" className="text-gray-300 hover:text-red-500 transition">Membership</a>
            <a href="#about" className="text-gray-300 hover:text-red-500 transition">About</a>
            <a href="#contact" className="text-gray-300 hover:text-red-500 transition">Contact</a>
            <Link to="/admin/login" className="text-gray-500 hover:text-red-500 text-sm transition">Admin</Link>
          </div>

          {/* Auth Buttons - Desktop */}
          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Link 
                  to="/member/dashboard" 
                  className="flex items-center gap-2 text-gray-300 hover:text-white transition"
                >
                  <User className="w-4 h-4" />
                  {user?.first_name || "Dashboard"}
                </Link>
                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg font-medium transition"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-300 hover:text-white transition">
                  Login
                </Link>
                <button 
                  onClick={scrollToPricing}
                  className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg font-medium transition"
                >
                  Join Now
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-black border-t border-red-900">
          <div className="px-4 py-4 space-y-3">
            <a href="#features" className="block text-gray-300 hover:text-red-500">Features</a>
            <a href="#membership" className="block text-gray-300 hover:text-red-500">Membership</a>
            <a href="#about" className="block text-gray-300 hover:text-red-500">About</a>
            <a href="#contact" className="block text-gray-300 hover:text-red-500">Contact</a>
            <div className="pt-3 border-t border-red-900 flex flex-col gap-3">
              {isAuthenticated ? (
                <>
                  <Link 
                    to="/member/dashboard" 
                    className="flex items-center gap-2 text-gray-300 hover:text-white"
                  >
                    <User className="w-4 h-4" />
                    {user?.first_name || "Dashboard"}
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="flex items-center justify-center gap-2 bg-red-600 text-white px-5 py-2 rounded-lg font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="text-gray-300 hover:text-white">Login</Link>
                  <button 
                    onClick={scrollToPricing}
                    className="bg-red-600 text-white px-5 py-2 rounded-lg text-center font-medium"
                  >
                    Join Now
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
