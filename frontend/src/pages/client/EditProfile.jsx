// pages/client/EditProfile.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../../api/axios.js";
import { useNotification } from "../../context/NotificationContext.jsx";
import Navbar from "../../components/Navbar.jsx";
import { 
   User, 
   Mail, 
   Phone, 
   MapPin, 
   Calendar,
   Dumbbell,
   Heart,
   AlertCircle,
   CheckCircle,
   ChevronLeft,
   Save,
   Loader2
} from "lucide-react";

export default function EditProfile() {
  const { user, isAuthenticated, setIsAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { success, error } = useNotification();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState({
    first_name: "",
    last_name: "",
    gender: "",
    date_of_birth: "",
    phone: "",
    email: "",
    address: "",
    emergency_name: "",
    emergency_contact: "",
    emergency_relationship: "",
    experience_level: "",
    days_per_week: "",
    session_minutes: "",
    height: "",
    weight: "",
    bmi: "",
    fitness_goal: [],
    training_type: ""
  });

  const [errors, setErrors] = useState({});
  const [formChanged, setFormChanged] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    fetchProfile();
  }, [isAuthenticated]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get("/client/profile");
      const data = response.data;
      
      setProfileData({
        first_name: data.first_name || "",
        last_name: data.last_name || "",
        gender: data.gender || "",
        date_of_birth: data.date_of_birth ? new Date(data.date_of_birth).toISOString().split('T')[0] : "",
        phone: data.phone || "",
        email: data.email || "",
        address: data.address || "",
        emergency_name: data.emergency_name || "",
        emergency_contact: data.emergency_contact || "",
        emergency_relationship: data.emergency_relationship || "",
        experience_level: data.experience_level || "",
        days_per_week: data.days_per_week || "",
        session_minutes: data.session_minutes || "",
        height: data.height || "",
        weight: data.weight || "",
        bmi: data.bmi || "",
        fitness_goal: data.fitness_goal || [],
        training_type: data.training_type || ""
      });
    } catch (err) {
      console.error("Error fetching profile:", err);
      error("Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setProfileData(prev => {
      const newData = { ...prev, [name]: value };
      
      // Auto-calculate BMI when height or weight changes
      if (name === "height" || name === "weight") {
        const height = name === "height" ? Number(value) : Number(prev.height);
        const weight = name === "weight" ? Number(value) : Number(prev.weight);
        
        if (height > 0 && weight > 0) {
          const heightInMeters = height / 100;
          const bmiValue = (weight / (heightInMeters * heightInMeters)).toFixed(1);
          newData.bmi = bmiValue;
        }
      }
      
      return newData;
    });
    
    setFormChanged(true);
    
    // Clear error when field is modified
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleFitnessGoalChange = (goal) => {
    setProfileData(prev => {
      const goals = prev.fitness_goal.includes(goal)
        ? prev.fitness_goal.filter(g => g !== goal)
        : [...prev.fitness_goal, goal];
      return { ...prev, fitness_goal: goals };
    });
    setFormChanged(true);
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!profileData.first_name?.trim()) {
      newErrors.first_name = "First name is required";
    }
    if (!profileData.last_name?.trim()) {
      newErrors.last_name = "Last name is required";
    }
    if (!profileData.gender) {
      newErrors.gender = "Gender is required";
    }
    if (!profileData.date_of_birth) {
      newErrors.date_of_birth = "Date of birth is required";
    } else {
      const dob = new Date(profileData.date_of_birth);
      const today = new Date();
      if (dob > today) {
        newErrors.date_of_birth = "Date of birth cannot be in the future";
      }
    }
    if (profileData.phone && isNaN(Number(profileData.phone))) {
      newErrors.phone = "Phone number must be numeric";
    }
    if (profileData.height && (isNaN(Number(profileData.height)) || Number(profileData.height) <= 0)) {
      newErrors.height = "Height must be a positive number";
    }
    if (profileData.weight && (isNaN(Number(profileData.weight)) || Number(profileData.weight) <= 0)) {
      newErrors.weight = "Weight must be a positive number";
    }
    if (profileData.session_minutes && (isNaN(Number(profileData.session_minutes)) || Number(profileData.session_minutes) <= 0)) {
      newErrors.session_minutes = "Session minutes must be a positive number";
    }
    if (profileData.emergency_contact && isNaN(Number(profileData.emergency_contact))) {
      newErrors.emergency_contact = "Emergency contact must be numeric";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setSaving(true);
      
      const response = await api.patch("/client/profile", profileData);
      
      success("Profile updated successfully!");
      
      // Update user in context
      if (response.data.user) {
        setIsAuthenticated(true);
      }
      
      setFormChanged(false);
      navigate("/client/dashboard");
    } catch (err) {
      console.error("Error updating profile:", err);
      const message = err.response?.data?.message || "Failed to update profile";
      error(message);
    } finally {
      setSaving(false);
    }
  };

  const fitnessGoalOptions = [
    "weight loss", "muscle gain", "strength", 
    "endurance", "flexibility", "cardio",
    "general fitness", "sports performance"
  ];

  const experienceLevels = ["beginner", "intermediate", "advanced"];
  const trainingTypes = ["strength training", "cardio", "HIIT", "yoga", "crossfit", "bodybuilding"];
  const relationships = ["spouse", "parent", "sibling", "friend", "other"];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
        <Navbar />


      {/* Main Content */}
      <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information Card */}
            <div className="p-6 rounded-2xl bg-slate-800/40 backdrop-blur-xl border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-6 flex items-center space-x-2">
                <User className="w-5 h-5 text-red-400" />
                <span>Personal Information</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* First Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    First Name <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="first_name"
                      value={profileData.first_name}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 rounded-xl bg-slate-700/50 border ${errors.first_name ? 'border-red-500' : 'border-white/10'} text-white placeholder-slate-400 focus:outline-none focus:border-red-500 transition`}
                      placeholder="Enter first name"
                    />
                    {errors.first_name && (
                      <p className="mt-1 text-sm text-red-400 flex items-center space-x-1">
                        <AlertCircle className="w-3 h-3" />
                        <span>{errors.first_name}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Last Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Last Name <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="last_name"
                      value={profileData.last_name}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 rounded-xl bg-slate-700/50 border ${errors.last_name ? 'border-red-500' : 'border-white/10'} text-white placeholder-slate-400 focus:outline-none focus:border-red-500 transition`}
                      placeholder="Enter last name"
                    />
                    {errors.last_name && (
                      <p className="mt-1 text-sm text-red-400 flex items-center space-x-1">
                        <AlertCircle className="w-3 h-3" />
                        <span>{errors.last_name}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Email <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="email"
                      name="email"
                      value={profileData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-3 pl-11 rounded-xl bg-slate-700/50 border border-white/10 text-white placeholder-slate-400 focus:outline-none focus:border-red-500 transition"
                      placeholder="Enter email"
                      readOnly
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Phone
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      name="phone"
                      value={profileData.phone}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 pl-11 rounded-xl bg-slate-700/50 border ${errors.phone ? 'border-red-500' : 'border-white/10'} text-white placeholder-slate-400 focus:outline-none focus:border-red-500 transition`}
                      placeholder="Enter phone number"
                    />
                    {errors.phone && (
                      <p className="mt-1 text-sm text-red-400 flex items-center space-x-1">
                        <AlertCircle className="w-3 h-3" />
                        <span>{errors.phone}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Date of Birth */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Date of Birth <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="date"
                      name="date_of_birth"
                      value={profileData.date_of_birth}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 pl-11 rounded-xl bg-slate-700/50 border ${errors.date_of_birth ? 'border-red-500' : 'border-white/10'} text-white placeholder-slate-400 focus:outline-none focus:border-red-500 transition`}
                    />
                    {errors.date_of_birth && (
                      <p className="mt-1 text-sm text-red-400 flex items-center space-x-1">
                        <AlertCircle className="w-3 h-3" />
                        <span>{errors.date_of_birth}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Gender <span className="text-red-400">*</span>
                  </label>
                  <select
                    name="gender"
                    value={profileData.gender}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-xl bg-slate-700/50 border ${errors.gender ? 'border-red-500' : 'border-white/10'} text-white focus:outline-none focus:border-red-500 transition`}
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                  {errors.gender && (
                    <p className="mt-1 text-sm text-red-400 flex items-center space-x-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>{errors.gender}</span>
                    </p>
                  )}
                </div>

                {/* Address */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Address
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      name="address"
                      value={profileData.address}
                      onChange={handleChange}
                      className="w-full px-4 py-3 pl-11 rounded-xl bg-slate-700/50 border border-white/10 text-white placeholder-slate-400 focus:outline-none focus:border-red-500 transition"
                      placeholder="Enter address"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Physical Information Card */}
            <div className="p-6 rounded-2xl bg-slate-800/40 backdrop-blur-xl border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-6 flex items-center space-x-2">
                <Dumbbell className="w-5 h-5 text-cyan-400" />
                <span>Physical Information</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Height */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Height (cm)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name="height"
                      value={profileData.height}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 rounded-xl bg-slate-700/50 border ${errors.height ? 'border-red-500' : 'border-white/10'} text-white placeholder-slate-400 focus:outline-none focus:border-red-500 transition`}
                      placeholder="e.g., 175"
                      min="0"
                      step="0.1"
                    />
                    {errors.height && (
                      <p className="mt-1 text-sm text-red-400 flex items-center space-x-1">
                        <AlertCircle className="w-3 h-3" />
                        <span>{errors.height}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Weight */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Weight (kg)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name="weight"
                      value={profileData.weight}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 rounded-xl bg-slate-700/50 border ${errors.weight ? 'border-red-500' : 'border-white/10'} text-white placeholder-slate-400 focus:outline-none focus:border-red-500 transition`}
                      placeholder="e.g., 70"
                      min="0"
                      step="0.1"
                    />
                    {errors.weight && (
                      <p className="mt-1 text-sm text-red-400 flex items-center space-x-1">
                        <AlertCircle className="w-3 h-3" />
                        <span>{errors.weight}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* BMI (Read-only) */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    BMI (Auto-calculated)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="bmi"
                      value={profileData.bmi || "N/A"}
                      className="w-full px-4 py-3 rounded-xl bg-slate-700/30 border border-white/10 text-slate-400"
                      readOnly
                    />
                    {profileData.bmi && (
                      <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-green-400" />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Fitness Goals Card */}
            <div className="p-6 rounded-2xl bg-slate-800/40 backdrop-blur-xl border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-6 flex items-center space-x-2">
                <Heart className="w-5 h-5 text-green-400" />
                <span>Fitness Information</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Fitness Goals */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-3">
                    Fitness Goals
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {fitnessGoalOptions.map(goal => (
                      <button
                        key={goal}
                        type="button"
                        onClick={() => handleFitnessGoalChange(goal)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                          profileData.fitness_goal.includes(goal)
                            ? "bg-red-600 text-white"
                            : "bg-slate-700/50 text-slate-300 hover:bg-slate-700"
                        }`}
                      >
                        {goal}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Training Type */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Training Type
                  </label>
                  <select
                    name="training_type"
                    value={profileData.training_type}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl bg-slate-700/50 border border-white/10 text-white focus:outline-none focus:border-red-500 transition"
                  >
                    <option value="">Select training type</option>
                    {trainingTypes.map(type => (
                      <option key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Experience Level */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Experience Level
                  </label>
                  <select
                    name="experience_level"
                    value={profileData.experience_level}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl bg-slate-700/50 border border-white/10 text-white focus:outline-none focus:border-red-500 transition"
                  >
                    <option value="">Select experience</option>
                    {experienceLevels.map(level => (
                      <option key={level} value={level}>
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Days Per Week */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Days Per Week
                  </label>
                  <input
                    type="number"
                    name="days_per_week"
                    value={profileData.days_per_week}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl bg-slate-700/50 border border-white/10 text-white placeholder-slate-400 focus:outline-none focus:border-red-500 transition"
                    placeholder="e.g., 4"
                    min="1"
                    max="7"
                  />
                </div>

                {/* Session Minutes */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Session Duration (minutes)
                  </label>
                  <input
                    type="number"
                    name="session_minutes"
                    value={profileData.session_minutes}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-xl bg-slate-700/50 border ${errors.session_minutes ? 'border-red-500' : 'border-white/10'} text-white placeholder-slate-400 focus:outline-none focus:border-red-500 transition`}
                    placeholder="e.g., 60"
                    min="0"
                  />
                  {errors.session_minutes && (
                    <p className="mt-1 text-sm text-red-400 flex items-center space-x-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>{errors.session_minutes}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Emergency Contact Card */}
            <div className="p-6 rounded-2xl bg-slate-800/40 backdrop-blur-xl border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-6 flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-amber-400" />
                <span>Emergency Contact</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Emergency Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Contact Name
                  </label>
                  <input
                    type="text"
                    name="emergency_name"
                    value={profileData.emergency_name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl bg-slate-700/50 border border-white/10 text-white placeholder-slate-400 focus:outline-none focus:border-red-500 transition"
                    placeholder="Emergency contact name"
                  />
                </div>

                {/* Emergency Contact */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Contact Number
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="emergency_contact"
                      value={profileData.emergency_contact}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 rounded-xl bg-slate-700/50 border ${errors.emergency_contact ? 'border-red-500' : 'border-white/10'} text-white placeholder-slate-400 focus:outline-none focus:border-red-500 transition`}
                      placeholder="Contact number"
                    />
                    {errors.emergency_contact && (
                      <p className="mt-1 text-sm text-red-400 flex items-center space-x-1">
                        <AlertCircle className="w-3 h-3" />
                        <span>{errors.emergency_contact}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Relationship */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Relationship
                  </label>
                  <select
                    name="emergency_relationship"
                    value={profileData.emergency_relationship}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl bg-slate-700/50 border border-white/10 text-white focus:outline-none focus:border-red-500 transition"
                  >
                    <option value="">Select relationship</option>
                    {relationships.map(rel => (
                      <option key={rel} value={rel}>
                        {rel.charAt(0).toUpperCase() + rel.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate("/client/dashboard")}
                className="px-6 py-3 rounded-xl bg-slate-700/50 hover:bg-slate-700 text-white font-medium transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !formChanged}
                className={`px-6 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-medium transition flex items-center space-x-2 ${
                  saving || !formChanged ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </main>

      {/* Custom CSS */}
      <style>{`
        .glass-header {
          background: rgba(30, 41, 59, 0.7);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
      `}</style>
    </div>
  );
}
