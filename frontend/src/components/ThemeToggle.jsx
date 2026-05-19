import { motion } from "framer-motion";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

export default function ThemeToggle({ className = "" }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <motion.button
      onClick={toggleTheme}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`relative p-2 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 border border-white/10 transition-colors ${className}`}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      {theme === "dark" ? (
        <Moon className="w-5 h-5 text-yellow-400" />
      ) : (
        <Sun className="w-5 h-5 text-yellow-500" />
      )}
    </motion.button>
  );
}
