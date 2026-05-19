import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    // Check localStorage or default to dark mode
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("theme");
      if (stored) return stored;
      // Default to dark mode
      return "dark";
    }
    return "dark";
  });

  useEffect(() => {
    const root = document.documentElement;
    
    if (theme === "light") {
      root.setAttribute("data-theme", "light");
      // Light theme CSS variables
      root.style.setProperty("--bg-primary", "#f8fafc");
      root.style.setProperty("--bg-secondary", "#e2e8f0");
      root.style.setProperty("--bg-card", "#ffffff");
      root.style.setProperty("--text-primary", "#0f172a");
      root.style.setProperty("--text-secondary", "#475569");
      root.style.setProperty("--border-color", "#cbd5e1");
    } else {
      root.setAttribute("data-theme", "dark");
      // Dark theme CSS variables (default)
      root.style.setProperty("--bg-primary", "#0f172a");
      root.style.setProperty("--bg-secondary", "#1e293b");
      root.style.setProperty("--bg-card", "#1e293b");
      root.style.setProperty("--text-primary", "#f1f5f9");
      root.style.setProperty("--text-secondary", "#94a3b8");
      root.style.setProperty("--border-color", "#334155");
    }
    
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
