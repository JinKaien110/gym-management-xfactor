// pages/Dashboard.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios.js";

export default function Dashboard() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
  if (!isAuthenticated) return;

  }, [isAuthenticated]);

  

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  if (!user) return <p>Loading user data...</p>;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-6">
      <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-2xl text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Dashboard</h1>

        <p className="text-gray-700 mb-2">
          <strong>Name:</strong> {user.name || "N/A"}
        </p>
        <p className="text-gray-700 mb-2">
          <strong>Email:</strong> {user.email || "N/A"}
        </p>
        <p className="text-gray-700 mb-2">
          <strong>Role:</strong> {user.role || "N/A"}
        </p>

        <p className="text-gray-700 mb-2">
          <strong>Age:</strong> {user.age || "N/A"}
        </p>
        <p className="text-gray-700 mb-2">
          <strong>Height:</strong> {user.height || "N/A"} cm
        </p>
        <p className="text-gray-700 mb-2">
          <strong>Weight:</strong> {user.weight || "N/A"} kg
        </p>
        <p className="text-gray-700 mb-2">
          <strong>BMI:</strong> {user.bmi || "N/A"}
        </p>
        <p className="text-gray-700 mb-6">
          <strong>Fitness Goal:</strong> {user.fitness_goal || "N/A"}
        </p>

        <button
          onClick={handleLogout}
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-semibold text-lg transition"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
