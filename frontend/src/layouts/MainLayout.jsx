// src/layouts/MainLayout.jsx
import Navbar from "../components/Navbar.jsx";
import AnimatedBackground from "../components/AnimatedBackground.jsx";

export default function MainLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <AnimatedBackground />
      <Navbar />
      <main className="relative z-10">{children}</main>
    </div>
  );
}