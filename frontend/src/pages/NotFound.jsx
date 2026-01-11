import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { colors } from "../theme/colors";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen flex items-center justify-center 
      bg-gradient-to-br from-black to-red-900 p-6"
    >
      <div
        style={{ background: colors.card, borderColor: colors.primary }}
        className="max-w-md w-full rounded-2xl border shadow-xl p-8 text-center"
      >
        <h1
          style={{ color: colors.primary }}
          className="text-6xl font-extrabold mb-4"
        >
          404
        </h1>

        <p
          style={{ color: colors.text }}
          className="text-xl font-semibold mb-2"
        >
          Page Not Found
        </p>

        <p
          style={{ color: colors.muted }}
          className="mb-6"
        >
          The page you are looking for doesn’t exist or was moved.
        </p>

        <button
          onClick={() => navigate("/")}
          style={{ background: colors.primary }}
          className="w-full py-3 rounded-xl font-semibold text-white transition hover:opacity-90"
        >
          Go Back Home
        </button>
      </div>
    </motion.div>
  );
}


<p
          style={{ color: colors.text }}
          className="text-xl font-semibold mb-2"
        >
          Page Not Found
        </p>