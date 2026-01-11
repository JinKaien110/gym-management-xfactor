import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function LoadingSpinner() {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setLoading(false);
        }, 3000);

        return () => clearTimeout(timer);
    }, []);

    if(!loading) return null;

     return (
 <div className="fixed inset-0 flex justify-center items-center z-50 bg-transparent">
      <motion.div
        className="w-16 h-16 border-4 border-red-700 border-t-red-500 rounded-full animate-spin shadow-xl"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.5 }}
      ></motion.div>
    </div>
  );
}