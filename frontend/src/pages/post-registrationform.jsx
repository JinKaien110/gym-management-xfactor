import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios.js";
import { motion } from "framer-motion";
import LoadingSpinner from "../components/LoadingSpinner.jsx";

export default function PostRegistrationForm() {

    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [showOtherGoal, setShowOtherGoal] = useState(false);
    const [message, setMessage] = useState(null);

    const [formData, setFormData] = useState({
        gender: "",
        age: "",
        height: "",
        weight: "",
        bmi: "",
        fitness_goal: "",
        medical_condition: ""
    });

    // update form fields
    const handleChange = (e) => {
        const { name, value } = e.target;

        let updated = { ...formData, [name]: value };

        // auto BMI calculation
        if (name === "height" || name === "weight") {
            const h = name === "height" ? Number(value) : Number(updated.height);
            const w = name === "weight" ? Number(value) : Number(updated.weight);

            if (h > 0 && w > 0) {
                updated.bmi = Number((w / ((h / 100) ** 2)).toFixed(1));

            }
        }

        setFormData(updated);
    };

    // fitness goal change
    const handleGoalChange = (e) => {
        const value = e.target.value;

        if (value === "other") {
            setShowOtherGoal(true);
            setFormData({ ...formData, fitness_goal: "" });
        } else {
            setShowOtherGoal(false);
            setFormData({ ...formData, fitness_goal: value });
        }
    };

    // submit form
    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log(formData)

        try {
            const request = await api.patch("/member/postform", formData);

            setMessage(request.data.message);
            setTimeout(() => {
                setLoading(false);
            }, 1000); 
            navigate("/member/dashboard");

        } catch (error) {
            setMessage(error.response?.data?.message || "Something went wrong.");
        }
    };

    return (
        <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-black to-red-900">
            {loading && <LoadingSpinner />}
            <div className="bg-[#1a0000] shadow-xl rounded-2xl p-8 w-full max-w-2xl border border-red-700">

                <h2 className="text-3xl font-bold text-red-400 mb-6 text-center">
                    Complete Your Personal Information
                </h2>

                {message && (
                    <p className="mb-4 text-center text-red-300">{message}</p>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Gender */}
                    <div>
                        <label className="block text-gray-200 font-semibold mb-2">Gender</label>
                        <select
                            name="gender"
                            value={formData.gender}
                            onChange={handleChange}
                            required
                            className="w-full bg-black border border-red-600 text-white rounded-lg p-3 focus:ring-2 focus:ring-red-500"
                        >
                            <option value="" disabled>Select Gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                        </select>
                    </div>

                    {/* Age */}
                    <div>
                        <label className="block text-gray-200 font-semibold mb-2">Age</label>
                        <input
                            type="number"
                            name="age"
                            onChange={handleChange}
                            value={formData.age}
                            required
                            min="10"
                            max="100"
                            className="w-full bg-black border border-red-600 text-white rounded-lg p-3 focus:ring-2 focus:ring-red-500 no-spin"
                            placeholder="Enter your age"
                        />
                    </div>

                    {/* Height & Weight */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-gray-200 font-semibold mb-2">Height (cm)</label>
                            <input
                                type="number"
                                name="height"
                                onChange={handleChange}
                                value={formData.height}
                                required
                                className="w-full bg-black border border-red-600 text-white rounded-lg p-3 focus:ring-2 focus:ring-red-500 no-spin"
                                placeholder="e.g. 170"
                            />
                        </div>

                        <div>
                            <label className="block text-gray-200 font-semibold mb-2">Weight (kg)</label>
                            <input
                                type="number"
                                name="weight"
                                onChange={handleChange}
                                value={formData.weight}
                                required
                                className="w-full bg-black border border-red-600 text-white rounded-lg p-3 focus:ring-2 focus:ring-red-500 no-spin"
                                placeholder="e.g. 65"
                            />
                        </div>
                    </div>

                    {/* Fitness Goal */}
                    <div>
                        <label className="block text-gray-200 font-semibold mb-2">Fitness Goal</label>

                        <select
                            name="fitness_goal"
                            value={formData.fitness_goal}
                            onChange={handleGoalChange}
                            className="w-full bg-black border border-red-600 text-white rounded-lg p-3 focus:ring-2 focus:ring-red-500"
                        >
                            <option value="" disabled>Select your fitness goal</option>
                            <option value="bulk">Bulk</option>
                            <option value="cut">Cut</option>
                            <option value="exercise">Just Exercise</option>
                            <option value="other">Other (Write below)</option>
                        </select>

                        {showOtherGoal && (
                            <input
                                type="text"
                                name="fitness_goal"
                                onChange={handleChange}
                                className="w-full bg-black border border-red-600 text-white rounded-lg p-3 mt-3 focus:ring-2 focus:ring-red-500"
                                placeholder="Enter custom fitness goal"
                            />
                        )}
                    </div>

                    {/* Medical Condition */}
                    <div>
                        <label className="block text-gray-200 font-semibold mb-2">
                            Medical Condition (Optional)
                        </label>
                        <textarea
                            name="medical_condition"
                            rows="3"
                            onChange={handleChange}
                            value={formData.medical_condition}
                            className="w-full bg-black border border-red-600 text-white rounded-lg p-3 focus:ring-2 focus:ring-red-500"
                            placeholder="Write any medical conditions (optional)"
                        ></textarea>
                    </div>

                    {/* Submit */}
                    <button
                        className="w-full bg-red-600 hover:bg-red-700 text-white p-3 rounded-xl font-semibold text-lg transition">
                        Submit Information
                    </button>

                </form>

            </div>
        </motion.div>
    );
}
