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
  ChevronDown,
  Package,
  List,
  Settings,
  PieChart,
  TrendingUp,
  BarChart3,
  Layers,
  Briefcase,
  ClipboardList,
  Target,
  Award,
  Activity
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { PageTransition } from "../components/UIEnhancements.jsx";
import ThemeToggle from "../components/ThemeToggle.jsx";

// Swirling orb component for fluid animation
const SwirlOrb = ({ className, style, delay = 0, size = 'large' }) => {
  const sizes = {
    small: 'w-32 h-32',
    medium: 'w-48 h-48', 
    large: 'w-64 h-64'
  };
  return (
    <div 
      className={`absolute rounded-full blur-3xl ${sizes[size]} ${className}`}
      style={{
        ...style,
        animation: `swirl ${20 + Math.random() * 15}s ease-in-out infinite`,
        animationDelay: `${delay}s`
      }}
    />
  );
};

// Flowing ribbon component
const FlowRibbon = ({ className, style, delay = 0 }) => (
  <div 
    className={`absolute rounded-full blur-2xl ${className}`}
    style={{
      ...style,
      animation: `flow ${25 + Math.random() * 10}s ease-in-out infinite`,
      animationDelay: `${delay}s`
    }}
  />
);

// Floating icon with glass effect
const GlassIcon = ({ icon: Icon, className, style, delay = 0, zIndex = 0 }) => (
  <div 
    className={`absolute opacity-20 ${className}`}
    style={{
      ...style,
      zIndex,
      animation: `drift ${18 + Math.random() * 12}s ease-in-out infinite`,
      animationDelay: `${delay}s`
    }}
  >
    <Icon className="w-14 h-14" />
  </div>
);

// Background icons data

const bgIcons = [
  { icon: PieChart, x: '10%', y: '20%', scale: 1.2, delay: 0 },
  { icon: TrendingUp, x: '85%', y: '15%', scale: 0.8, delay: 2 },
  { icon: BarChart3, x: '75%', y: '70%', scale: 1, delay: 4 },
  { icon: Activity, x: '20%', y: '80%', scale: 0.9, delay: 1 },
  { icon: Layers, x: '60%', y: '30%', scale: 1.1, delay: 3 },
  { icon: Briefcase, x: '5%', y: '60%', scale: 0.7, delay: 5 },
  { icon: ClipboardList, x: '90%', y: '50%', scale: 0.85, delay: 2.5 },
  { icon: Target, x: '35%', y: '10%', scale: 0.95, delay: 1.5 },
  { icon: Award, x: '50%', y: '85%', scale: 1.05, delay: 3.5 },
  { icon: Settings, x: '25%', y: '45%', scale: 0.75, delay: 4.5 },
];

// Helper function to capitalize first letter
const ucfirst = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

const menuItems = [
  { name: "Dashboard", icon: Home, path: "/admin/dashboard" },
  { name: "Clients", icon: Users, path: "/admin/clients" },
  { name: "Freeze Requests", icon: FileText, path: "/admin/membership-requests" },
  { name: "Memberships", icon: CreditCard, path: "/admin/memberships" },
  { name: "Payments", icon: DollarSign, path: "/admin/payments" },
  { name: "Classes", icon: BookOpen, path: "/admin/classes" },
  { name: "Schedules", icon: Calendar, path: "/admin/schedules" },
  { name: "Trainers", icon: UserCog, path: "/admin/trainers" },
  { name: "Pricing", icon: Tag, path: "/admin/pricing" },
  { name: "Plans", icon: Package, path: "/admin/plans" },
  { name: "Bookings", icon: Calendar, path: "/admin/bookings" },
  { name: "Discounts Requests", icon: CreditCard, path: "/admin/discounts" },
  { name: "Analytics", icon: BarChart3, path: "/admin/analytics" },
    { name: "Membership Config", icon: Settings, path: "/admin/membership-config" },
    { name: "Activity Logs", icon: Activity, path: "/admin/activity-logs" },
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex relative overflow-hidden">
      {/* Animated Fluid Gradient Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* Fluid gradient base - blue, purple, pink */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/30 via-purple-900/30 to-pink-900/30"></div>
        
        {/* Swirling orbs - vibrant hues */}
        <SwirlOrb 
          className="bg-blue-500/30" 
          style={{ top: '10%', left: '5%' }} 
          delay={0} 
          size="large" 
        />
        <SwirlOrb 
          className="bg-purple-500/30" 
          style={{ top: '60%', left: '20%' }} 
          delay={5} 
          size="medium" 
        />
        <SwirlOrb 
          className="bg-pink-500/30" 
          style={{ top: '30%', right: '10%' }} 
          delay={10} 
          size="large" 
        />
        <SwirlOrb 
          className="bg-blue-400/20" 
          style={{ bottom: '15%', right: '25%' }} 
          delay={3} 
          size="medium" 
        />
        <SwirlOrb 
          className="bg-purple-400/20" 
          style={{ top: '45%', left: '40%' }} 
          delay={8} 
          size="small" 
        />
        
        {/* Flowing ribbons */}
        <FlowRibbon 
          className="bg-blue-600/20 w-96 h-96" 
          style={{ top: '20%', left: '30%' }} 
          delay={0} 
        />
        <FlowRibbon 
          className="bg-purple-600/20 w-80 h-80" 
          style={{ bottom: '30%', right: '15%' }} 
          delay={4} 
        />
        <FlowRibbon 
          className="bg-pink-600/20 w-72 h-72" 
          style={{ top: '50%', left: '10%' }} 
          delay={8} 
        />
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-5"></div>
        
        {/* Glass-effect floating icons beneath glass layer */}
        {bgIcons.map((item, index) => (
          <GlassIcon
            key={index}
            icon={item.icon}
            className=""
            style={{
              left: item.x,
              top: item.y,
            }}
            delay={item.delay}
            zIndex={item.zIndex}
          />
        ))}
      </div>

      {/* Glass overlay - creates depth effect */}
      <div className="fixed inset-0 z-5 bg-gradient-to-b from-transparent via-transparent to-slate-900/20 pointer-events-none"></div>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          bg-slate-800/60 backdrop-blur-xl border-r border-white/10
          shadow-2xl shadow-black/20
          transition-all duration-300 ease-in-out
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${isSidebarExpanded ? 'lg:w-64' : 'lg:w-20'}
        `}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-2 lg:px-4 border-b border-white/10 overflow-hidden">
          <Link to="/admin/dashboard" className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-700 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-red-500/30">
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
                    ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-500/25' 
                    : 'text-slate-400 hover:bg-white/10 hover:text-white backdrop-blur-sm'
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
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-white/10 bg-slate-900/50 backdrop-blur-xl">
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
      <div className="flex-1 flex flex-col min-h-screen w-0">
        {/* Top Bar */}
        <header className="h-16 bg-slate-800/60 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-4 lg:px-6 shadow-lg shadow-black/10">
          <button 
            onClick={() => setMobileOpen(true)}
            className="lg:hidden text-slate-400 hover:text-white"
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <div className="flex-1 lg:flex-none" />

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="hidden sm:block text-right">
              <p className="text-white font-medium text-sm">
                {ucfirst(user?.first_name) || 'Admin'} {ucfirst(user?.last_name) || ''}
              </p>
              <p className="text-slate-400 text-xs capitalize">
                {user?.role || 'Administrator'}
              </p>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-700 rounded-full flex items-center justify-center shadow-lg shadow-red-500/30">
              <span className="text-white font-medium uppercase">
                {user?.first_name?.[0] || 'A'}{user?.last_name?.[0] || 'U'}
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto relative z-10">
          <PageTransition>
            <Outlet />
          </PageTransition>
        </main>
      </div>

      {/* CSS for fluid gradient animations */}
      <style>{`
        @keyframes swirl {
          0%, 100% {
            transform: translate(0, 0) scale(1);
            border-radius: 50%;
          }
          25% {
            transform: translate(30px, -40px) scale(1.1);
            border-radius: 40% 60% 70% 30%;
          }
          50% {
            transform: translate(-20px, 20px) scale(0.95);
            border-radius: 60% 40% 30% 70%;
          }
          75% {
            transform: translate(40px, 30px) scale(1.05);
            border-radius: 30% 70% 60% 40%;
          }
        }
        
        @keyframes flow {
          0%, 100% {
            transform: translateX(0) rotate(0deg) scale(1);
            opacity: 0.3;
          }
          33% {
            transform: translateX(50px) rotate(120deg) scale(1.2);
            opacity: 0.4;
          }
          66% {
            transform: translateX(-30px) rotate(240deg) scale(0.9);
            opacity: 0.2;
          }
        }
        
        @keyframes drift {
          0%, 100% {
            transform: translate(0, 0) rotate(0deg);
          }
          25% {
            transform: translate(15px, -25px) rotate(8deg);
          }
          50% {
            transform: translate(-10px, 15px) rotate(-5deg);
          }
          75% {
            transform: translate(25px, 10px) rotate(3deg);
          }
        }
      `}</style>
    </div>
  );
}
