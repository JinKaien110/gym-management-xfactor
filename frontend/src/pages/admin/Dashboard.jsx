import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Users, 
  CreditCard, 
  DollarSign, 
  Calendar, 
  UserCog,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw
} from "lucide-react";
import api from "../../api/axios.js";
import { useAuth } from "../../context/AuthContext.jsx";




const statsCards = [
  { 
    title: "Total Members", 
    icon: Users, 
    color: "bg-blue-600",
    path: "/admin/members",
    getValue: (data) => data.totalMembers || 0
  },
  { 
    title: "Active Memberships", 
    icon: CreditCard, 
    color: "bg-green-600",
    path: "/admin/memberships",
    getValue: (data) => data.activeMemberships || 0
  },
  { 
    title: "Total Revenue", 
    icon: DollarSign, 
    color: "bg-red-600",
    path: "/admin/payments",
    getValue: (data) => `₱${(data.totalRevenue || 0).toLocaleString()}`
  },
  { 
    title: "Pending Requests", 
    icon: Clock, 
    color: "bg-yellow-600",
    path: "/admin/memberships",
    getValue: (data) => data.pendingRequests || 0
  },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/admin/login");
    }
  }, [isAuthenticated, navigate]);
  
  const [stats, setStats] = useState({
    totalMembers: 0,
    activeMemberships: 0,
    totalRevenue: 0,
    pendingRequests: 0
  });
  const [todayClasses, setTodayClasses] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [revenueBreakdown, setRevenueBreakdown] = useState({
    newMemberships: 0,
    renewals: 0,
    other: 0
  });
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [revenueChange, setRevenueChange] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
  try {
    setLoading(true);

    const results = await Promise.allSettled([
      api.get("/admin/members?limit=1"),
      api.get("/admin/memberships?status=active"),
      api.get("/admin/payments/total-revenue"),
      api.get("/class-schedule?limit=50"),
      api.get("/admin/audit-logs?limit=50"),
      api.get("/discount-requests"),
      api.get("/membership-requests")
    ]);

    const [
      membersRes,
      membershipsRes,
      totalRevenueRes,
      classScheduleRes,
      auditLogsRes,
      discountRequestsRes,
      membershipRequestsRes
    ] = results.map(result =>
      result.status === "fulfilled" ? result.value : { data: {} }
    );


    // ==============================
    // TODAY CLASSES
    // ==============================
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const allClasses =
      classScheduleRes.data?.result ||
      classScheduleRes.data?.data ||
      [];

    const todayClassesData = Array.isArray(allClasses)
      ? allClasses
          .filter(cls => {
            if (!cls?.start_at && !cls?.date) return false;
            const classDate = new Date(cls.start_at || cls.date);
            return classDate >= today && classDate < tomorrow;
          })
          .slice(0, 5)
      : [];

    // ==============================
    // PENDING REQUESTS
    // ==============================
    const allDiscountRequests =
      discountRequestsRes.data?.data ||
      discountRequestsRes.data?.result ||
      [];

    const pendingDiscountRequests = Array.isArray(allDiscountRequests)
      ? allDiscountRequests.filter(d =>
          ["submitted", "pending"].includes(d?.status)
        ).length
      : 0;

    const allMembershipRequests =
      membershipRequestsRes.data?.data ||
      membershipRequestsRes.data?.result ||
      [];

    const pendingMembershipRequests = Array.isArray(allMembershipRequests)
      ? allMembershipRequests.filter(m =>
          ["draft", "pending_discount_review", "ready_for_payment"].includes(m?.status)
        ).length
      : 0;

    const pendingRequests =
      pendingDiscountRequests + pendingMembershipRequests;

    // ==============================
    // STATS
    // ==============================
    setStats({
      totalMembers: Number(membersRes.data?.total) || 0,
      activeMemberships: Number(membershipsRes.data?.total) || 0,
      totalRevenue: Number(totalRevenueRes.data?.totalRevenue) || 0,
      pendingRequests: pendingRequests
    });

    // ==============================
    // TODAY CLASSES STATE
    // ==============================
    setTodayClasses(
      todayClassesData.map(cls => ({
        _id: cls._id,
        name: cls.className || cls.class?.name || "Class",
        date: cls.date,
        start_at: cls.start_at,
        end_at: cls.end_at,
        spots: `${cls.current_participants || 0}/${cls.max_participants || 0}`
      }))
    );

    // ==============================
    // PENDING APPROVALS PREVIEW
    // ==============================
    const pendingApprovalsData = [
      ...(Array.isArray(allDiscountRequests)
        ? allDiscountRequests
            .filter(d => ["submitted", "pending"].includes(d?.status))
            .slice(0, 3)
            .map(d => ({
              type: "Discount",
              name:
                d.member?.first_name && d.member?.last_name
                  ? `${d.member.first_name} ${d.member.last_name}`
                  : "Member",
              action: d.discount_type || "Discount Request",
              _id: d._id
            }))
        : []),

      ...(Array.isArray(allMembershipRequests)
        ? allMembershipRequests
            .filter(m =>
              ["draft", "pending_discount_review", "ready_for_payment"].includes(m?.status)
            )
            .slice(0, 3)
            .map(m => ({
              type: "Membership",
              name:
                m.member?.first_name && m.member?.last_name
                  ? `${m.member.first_name} ${m.member.last_name}`
                  : "Member",
              action: "New Registration",
              _id: m._id
            }))
        : [])
    ];

    setPendingApprovals(pendingApprovalsData);

    // ==============================
    // REVENUE
    // ==============================
    const safeRevenue =
      Number(totalRevenueRes.data?.totalRevenue) || 0;

    setMonthlyRevenue(safeRevenue);
    setRevenueChange(0);

    setRevenueBreakdown({
      newMemberships: safeRevenue,
      renewals: 0,
      other: 0
    });

    // ==============================
    // RECENT ACTIVITIES
    // ==============================
    const auditLogs =
      auditLogsRes.data?.items ||
      auditLogsRes.data?.data ||
      [];

    const filteredLogs = Array.isArray(auditLogs)
      ? auditLogs.filter(
          log => log?.action?.toUpperCase() !== "AUTH_LOGIN"
        ).slice(0, 5)
      : [];

    const formattedActivities = filteredLogs.map(log => {
      let type = "info";

      if (log.status === "success") {
        type = "success";
      } else if (log.status === "fail") {
        type = "error";
      } else if (
        log.action?.toLowerCase().includes("update") ||
        log.action?.toLowerCase().includes("pending")
      ) {
        type = "warning";
      }

      const cleanMessage = (log.summary || log.action || "Activity recorded")
      .replace(/\(NaN\)/g, "")     // remove (NaN)
      .replace(/\s+/g, " ")        // normalize spacing
      .trim();

      return {
        type,
        message: cleanMessage,
        time: log.createdAt
          ? new Date(log.createdAt).toLocaleString()
          : "Just now"
      };
    });

    setRecentActivities(formattedActivities);

  } catch (err) {
    console.error("Unexpected dashboard error:", err);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      if (isMounted) {
        await fetchDashboardData();
      }
    };

    load();

    const interval = setInterval(() => {
      if (isMounted) {
        fetchDashboardData();
      }
    }, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-slate-400">Welcome back! Here's what's happening today.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={fetchDashboardData}
            disabled={loading}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <Link 
            to="/admin/members" 
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition"
          >
            + Add Member
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-slate-800 rounded-2xl p-6 border border-slate-700 hover:border-slate-600 transition"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-400 text-sm">{stat.title}</p>
                <p className="text-3xl font-bold text-white mt-2">
                  {loading ? "..." : stat.getValue(stats)}
                </p>
              </div>
              <div className={`p-3 rounded-xl ${stat.color}`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
            <Link 
              to={stat.path} 
              className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white mt-4"
            >
              View details <TrendingUp className="w-4 h-4" />
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
          <h2 className="text-lg font-bold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { name: "Add Member", path: "/admin/members", icon: Users },
              { name: "New Membership", path: "/admin/memberships", icon: CreditCard },
              { name: "Schedule Class", path: "/admin/schedules", icon: Calendar },
              { name: "Add Trainer", path: "/admin/trainers", icon: UserCog },
            ].map((action) => (
              <Link
                key={action.name}
                to={action.path}
                className="flex items-center gap-3 p-4 bg-slate-700/50 rounded-xl hover:bg-slate-700 transition"
              >
                <div className="p-2 bg-red-600/20 rounded-lg">
                  <action.icon className="w-5 h-5 text-red-500" />
                </div>
                <span className="text-white font-medium">{action.name}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
          <h2 className="text-lg font-bold text-white mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {recentActivities.length > 0 ? (
              recentActivities.map((activity, index) => (
                <div key={index} className="flex items-start gap-3">
                  {activity.type === "success" && (
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  )}
                  {activity.type === "warning" && (
                    <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  )}
                  {activity.type === "error" && (
                    <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  )}
                  {activity.type === "info" && (
                    <Clock className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm">{activity.message}</p>
                    <p className="text-slate-500 text-xs">{activity.time}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-500 text-sm">No recent activity</p>
            )}
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Classes */}
        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">Today's Classes</h2>
            <Link to="/admin/schedules" className="text-red-500 text-sm hover:underline">
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {todayClasses.length > 0 ? (
              todayClasses.map((cls, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-xl">
                  <div>
                    <p className="text-white font-medium">{cls.name}</p>
                    <p className="text-slate-400 text-sm">{cls.start_at}</p>
                  </div>
                  <span className="text-slate-400 text-sm">{cls.spots} spots</span>
                </div>
              ))
            ) : (
              <p className="text-slate-500 text-sm">No classes scheduled for today</p>
            )}
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">Pending Approvals</h2>
            <span className="bg-yellow-600 text-white text-xs px-2 py-1 rounded-full">
              {pendingApprovals.length} Pending
            </span>
          </div>
          <div className="space-y-3">
            {pendingApprovals.length > 0 ? (
              pendingApprovals.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-xl">
                  <div>
                    <p className="text-white font-medium">{item.name}</p>
                    <p className="text-slate-400 text-sm">{item.action}</p>
                  </div>
                  <span className="text-xs text-yellow-500 bg-yellow-600/20 px-2 py-1 rounded">
                    {item.type}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-slate-500 text-sm">No pending approvals</p>
            )}
          </div>
        </div>

        {/* Revenue Overview */}
        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">Revenue This Month</h2>
            <Link to="/admin/payments" className="text-red-500 text-sm hover:underline">
              View Details
            </Link>
          </div>
          <div className="text-center py-4">
            <p className="text-4xl font-bold text-white">₱{monthlyRevenue.toLocaleString()}</p>
            <p className={`text-sm mt-2 ${revenueChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {revenueChange >= 0 ? '+' : ''}{revenueChange}% from last month
            </p>
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">New Memberships</span>
              <span className="text-white">₱{(revenueBreakdown.newMemberships || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Renewals</span>
              <span className="text-white">₱{(revenueBreakdown.renewals || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Other</span>
              <span className="text-white">₱{(revenueBreakdown.other || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
