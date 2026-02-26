// src/layouts/MainLayout.jsx
import Navbar from "../components/Navbar.jsx";

export default function MainLayout({ children }) {
  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <main>{children}</main>
      {/* Optional: Footer */}
    </div>
  );
}
