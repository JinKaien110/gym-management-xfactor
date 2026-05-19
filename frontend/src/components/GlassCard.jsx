import React from "react";
import { motion } from "framer-motion";

export default function GlassCard({ 
  children, 
  className = "", 
  delay = 0,
  hoverEffect = true,
  padding = "p-6"
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={`
        relative rounded-2xl text-white
        ${padding}
        glass-card
        ${className}
      `}
    >
      <style>{`
        .glass-card {
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.12);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
          transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
        }
        
        .glass-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.35);
          border-color: rgba(255, 255, 255, 0.2);
        }
        
        @supports not (backdrop-filter: blur(16px)) and not (-webkit-backdrop-filter: blur(16px)) {
          .glass-card {
            background: rgb(30, 41, 59);
            border: 1px solid rgb(51, 65, 85);
            box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
          }
          
          .glass-card:hover {
            background: rgb(30, 41, 59);
            transform: translateY(-4px);
            box-shadow: 0 6px 28px rgba(0, 0, 0, 0.4);
            border-color: rgb(71, 85, 105);
          }
        }
      `}</style>
      {children}
    </motion.div>
  );
}

export function GlassPanel({ children, className = "" }) {
  return (
    <div className={`glass-panel ${className}`}>
      <style>{`
        .glass-panel {
          position: relative;
          border-radius: 1rem;
          color: white;
          padding: 1.5rem;
          background: rgba(255, 255, 255, 0.06);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);
        }
        
        @supports not (backdrop-filter: blur(20px)) and not (-webkit-backdrop-filter: blur(20px)) {
          .glass-panel {
            background: rgba(15, 23, 42, 0.95);
            border: 1px solid rgb(51, 65, 85);
          }
        }
      `}</style>
      {children}
    </div>
  );
}

export function GlassButton({ 
  children, 
  onClick,
  className = "", 
  variant = "primary",
  disabled = false,
  icon: Icon 
}) {
  const baseStyles = "relative px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2";
  
  const variants = {
    primary: {
      background: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
      hover: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
      shadow: "0 4px 16px rgba(220, 38, 38, 0.4)",
    },
    secondary: {
      background: "rgba(255, 255, 255, 0.1)",
      hover: "rgba(255, 255, 255, 0.2)",
      shadow: "none",
    },
    outline: {
      background: "transparent",
      border: "1px solid rgba(255, 255, 255, 0.3)",
      hover: "rgba(255, 255, 255, 0.1)",
    },
    ghost: {
      background: "transparent",
      hover: "rgba(255, 255, 255, 0.1)",
    },
  };

  const v = variants[variant];
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${className}`}
      style={{
        background: isHovered ? v.hover : v.background,
        border: variant === "outline" ? v.border : "none",
        boxShadow: v.shadow,
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {Icon && <Icon className="w-5 h-5" />}
      {children}
    </button>
  );
}

export function GlassInput({ 
  type = "text",
  placeholder,
  value,
  onChange,
  className = "",
  icon: Icon
}) {
  return (
    <div className={`glass-input-wrapper ${className}`}>
      {Icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          <Icon className="w-5 h-5" />
        </div>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full bg-transparent text-white placeholder-gray-400 outline-none"
        style={{ paddingLeft: Icon ? "2.5rem" : "1rem" }}
      />
      <style>{`
        .glass-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          border-radius: 0.75rem;
          background: rgba(255, 255, 255, 0.06);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.12);
          transition: border-color 0.3s ease, box-shadow 0.3s ease;
        }
        
        .glass-input-wrapper:focus-within {
          border-color: rgba(255, 255, 255, 0.3);
          box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.2);
        }
        
        @supports not (backdrop-filter: blur(8px)) and not (-webkit-backdrop-filter: blur(8px)) {
          .glass-input-wrapper {
            background: rgba(30, 41, 59, 0.8);
            border: 1px solid rgb(51, 65, 85);
          }
          
          .glass-input-wrapper:focus-within {
            border-color: rgb(71, 85, 105);
          }
        }
      `}</style>
    </div>
  );
}