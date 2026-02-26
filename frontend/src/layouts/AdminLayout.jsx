import { useState } from "react";
import { Link, useLocation, Outlet, useNavigate } from "react-router-dom";
import { 
  Dumbbell, 
  Menu, 
  X, 
  Home, 
  Users, 
  CreditCard, 
  Calendar, 
  UserCog, 
  Tag, 
  DollarSign,
  FileText,
  Bot,
  BookOpen,
  LogOut,
  ChevronDown
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

// Helper function to capitalize first letter
const ucfirst = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

const menuItems = [
  { name: "Dashboard", icon: Home, path: "/admin/dashboard" },
  { name: "Members", icon: Users, path: "/admin/members" },
  { name: "Membership Requests", icon: FileText, path: "/admin/membership-requests" },
  { name: "Memberships", icon: CreditCard, path: "/admin/memberships" },
  { name: "Payments", icon: DollarSign, path: "/admin/payments" },
  { name: "Classes", icon: BookOpen, path: "/admin/classes" },
  { name: "Schedules", icon: Calendar, path: "/admin/schedules" },
  { name: "Trainers", icon: UserCog, path: "/admin/trainers" },
  { name: "Pricing", icon: Tag, path: "/admin/pricing" },
  { name: "Plans", icon: FileText, path: "/admin/plans" },
  { name: "Bookings", icon: Calendar, path: "/admin/bookings" },
  { name: "Discounts", icon: CreditCard, path: "/admin/discounts" },
  { name: "AI Recommendations", icon: Bot, path: "/admin/ai-recommendations" },
];

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Sidebar expands on hover
  const isSidebarExpanded = isHovered || sidebarOpen;

  const handleLogout = async () => {
      await logout();
      navigate("/admin/login"); 
  };

  return (
    <div className="min-h-screen bg-slate-900 flex">
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed lg:static inset-y-0 left-0 z-50 
          bg-slate-800 border-r border-slate-700
          transition-all duration-300 ease-in-out
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${isSidebarExpanded ? 'lg:w-64' : 'lg:w-20'}
        `}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-2 lg:px-4 border-b border-slate-700 overflow-hidden">
          <Link to="/admin/dashboard" className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <Dumbbell className="w-6 h-6 text-white" />
            </div>
            <span className="text-white font-bold whitespace-nowrap overflow-hidden transition-all duration-300">
              {isSidebarExpanded && (
                <span className="opacity-100">6Pack Admin</span>
              )}
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1 overflow-y-auto h-[calc(100vh-8rem)]">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all
                  ${isActive 
                    ? 'bg-red-600 text-white' 
                    : 'text-slate-400 hover:bg-slate-700 hover:text-white'
                  }
                `}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {isSidebarExpanded && (
                  <span className="font-medium whitespace-nowrap">{item.name}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-slate-700 bg-slate-800">
          {isSidebarExpanded ? (
            <div className="flex items-center gap-3 p-2">
              <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-medium uppercase">
                  {user?.first_name?.[0] || 'A'}{user?.last_name?.[0] || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm truncate">
                  {ucfirst(user?.first_name) || 'Admin'} {ucfirst(user?.last_name) || ''}
                </p>
                <p className="text-slate-400 text-xs truncate">
                  {user?.email || 'admin@6pack.com'}
                </p>
              </div>
              <button 
                onClick={handleLogout}
                className="text-slate-400 hover:text-red-500 p-2"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center p-2 text-slate-400 hover:text-red-500"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="h-16 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-4 lg:px-6">
          <button 
            onClick={() => setMobileOpen(true)}
            className="lg:hidden text-slate-400 hover:text-white"
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <div className="flex-1 lg:flex-none" />

          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <p className="text-white font-medium text-sm">
                {ucfirst(user?.first_name) || 'Admin'} {ucfirst(user?.last_name) || ''}
              </p>
              <p className="text-slate-400 text-xs capitalize">
                {user?.role || 'Administrator'}
              </p>
            </div>
            <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center">
              <span className="text-white font-medium uppercase">
                {user?.first_name?.[0] || 'A'}{user?.last_name?.[0] || 'U'}
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
