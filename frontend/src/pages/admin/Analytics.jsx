import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, Legend
} from "recharts";
import { 
  TrendingUp, TrendingDown, Users, CreditCard, DollarSign, 
  Calendar, Activity, RefreshCw, Download, Filter, Bot, Loader, Eye, FileText,
  ArrowUp, ArrowDown, Minus, AlertTriangle, CheckCircle, Zap
} from "lucide-react";
import api from "../../api/axios.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useNotification } from "../../context/NotificationContext.jsx";
import Modal from "../../components/Modal.jsx";

const COLORS = ["#dc2626", "#16a34a", "#2563eb", "#f59e0b", "#8b5cf6", "#ec4899"];

export default function Analytics() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { success, error } = useNotification();
  
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [dateRange, setDateRange] = useState(6);
  const [businessRecommendation, setBusinessRecommendation] = useState(null);
  const [recommendationLoading, setRecommendationLoading] = useState(false);
  const [selectedRange, setSelectedRange] = useState("1_month");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [recommendationHistory, setRecommendationHistory] = useState([]);
  const [selectedRecommendation, setSelectedRecommendation] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/admin/login");
    }
  }, [isAuthenticated, navigate]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/analytics?months=${dateRange}`);
      console.log("Analytics response:", response.data);
      setAnalytics(response.data);
    } catch (err) {
      console.error("Error fetching analytics:", err);
      error("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    fetchRecommendationHistory();
  }, [dateRange]);

  const fetchRecommendationHistory = async () => {
    try {
      const response = await api.get("/ai/workout-recommendation?type=business");
      const recommendations = response.data.data || response.data.result || [];
      setRecommendationHistory(recommendations);
    } catch (err) {
      console.error("Error fetching recommendation history:", err);
    }
  };

  const handleExportPDF = (recommendation) => {
    if (!recommendation) return;
    
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Business Recommendation Report</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; max-width: 900px; margin: 0 auto; background: #fff; }
    h1 { color: #dc2626; border-bottom: 3px solid #dc2626; padding-bottom: 15px; margin-bottom: 30px; }
    h2 { color: #1f2937; margin-top: 40px; margin-bottom: 20px; }
    h3 { color: #4b5563; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 15px; }
    .meta { color: #6b7280; margin-bottom: 30px; font-size: 14px; }
    .summary-box { background: linear-gradient(135deg, #1f2937 0%, #374151 100%); color: white; padding: 25px; border-radius: 12px; margin-bottom: 30px; }
    .summary-box p { font-size: 16px; line-height: 1.6; }
    .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0; }
    .metric-card { background: #f9fafb; padding: 20px; border-radius: 10px; text-align: center; border: 1px solid #e5e7eb; }
    .metric-card .value { font-size: 28px; font-weight: bold; color: #1f2937; display: flex; align-items: center; justify-content: center; gap: 8px; }
    .metric-card .trend-arrow { font-size: 20px; }
    .metric-card .trend-arrow.trend-up { color: #16a34a; }
    .metric-card .trend-arrow.trend-down { color: #dc2626; }
    .metric-card .trend-arrow.trend-neutral { color: #6b7280; }
    .metric-card .metric-value { color: #1f2937; }
    .metric-card .label { font-size: 13px; color: #6b7280; margin-top: 5px; text-transform: uppercase; letter-spacing: 0.5px; }
    .highlights-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 15px; margin: 20px 0; }
    .highlight-card { padding: 20px; border-radius: 10px; }
    .highlight-card.positive { background: #dcfce7; border-left: 4px solid #16a34a; }
    .highlight-card.warning { background: #fef3c7; border-left: 4px solid #f59e0b; }
    .highlight-card.neutral { background: #f3f4f6; border-left: 4px solid #6b7280; }
    .highlight-card h4 { margin: 0 0 10px 0; color: #1f2937; font-size: 15px; }
    .highlight-card p { margin: 0; color: #4b5563; font-size: 14px; }
    .risks-section { margin: 25px 0; }
    .risk-card { display: flex; align-items: flex-start; gap: 15px; padding: 15px; background: #fef2f2; border-radius: 8px; margin-bottom: 10px; border-left: 4px solid #dc2626; }
    .risk-card .severity { padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: bold; text-transform: uppercase; }
    .risk-card .severity.high { background: #fecaca; color: #dc2626; }
    .risk-card .severity.medium { background: #fef3c7; color: #d97706; }
    .risk-card .severity.low { background: #d1fae5; color: #16a34a; }
    .risk-card h4 { margin: 0 0 5px 0; color: #1f2937; font-size: 14px; }
    .risk-card p { margin: 0; color: #6b7280; font-size: 13px; }
    .rec-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 20px; margin: 20px 0; }
    .rec-card { background: #f9fafb; padding: 20px; border-radius: 10px; border: 1px solid #e5e7eb; }
    .rec-card .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
    .rec-card .score { padding: 5px 12px; border-radius: 20px; font-size: 13px; font-weight: bold; }
    .rec-card .score.high { background: #fecaca; color: #dc2626; }
    .rec-card .score.medium { background: #fef3c7; color: #d97706; }
    .rec-card .score.low { background: #d1fae5; color: #16a34a; }
    .rec-card .category { color: #6b7280; font-size: 12px; }
    .rec-card h4 { margin: 0 0 10px 0; color: #1f2937; font-size: 16px; }
    .rec-card .description { color: #4b5563; font-size: 14px; line-height: 1.5; }
    .rec-card .impact { margin-top: 15px; padding-top: 15px; border-top: 1px solid #e5e7eb; color: #16a34a; font-size: 13px; font-weight: 500; }
    .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 12px; text-align: center; }
    @media print { body { padding: 20px; } .metrics-grid, .highlights-grid, .rec-grid { display: block; } .metric-card, .highlight-card, .rec-card { margin-bottom: 15px; page-break-inside: avoid; } }
  </style>
</head>
<body>
  <h1>Business Recommendation Report</h1>
  <div class="meta">
    <p><strong>Generated:</strong> ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
    <p><strong>Date Range:</strong> ${recommendation.date_range || recommendation.range || 'N/A'}</p>
  </div>

  <h2>Executive Summary</h2>
  <div class="summary-box">
    <p>${recommendation.analysis?.summary || 'No summary available.'}</p>
  </div>

  ${recommendation.analysis?.metrics && recommendation.analysis.metrics.length > 0 ? `
  <h2>Key Metrics</h2>
  <div class="metrics-grid">
    ${recommendation.analysis.metrics.map(m => `
    <div class="metric-card">
      <div class="value">${m.value}</div>
      <div class="label">${m.label}</div>
    </div>
    `).join('')}
  </div>
  ` : ''}

  ${recommendation.analysis?.highlights && recommendation.analysis.highlights.length > 0 ? `
  <h2>Highlights</h2>
  <div class="highlights-grid">
    ${recommendation.analysis.highlights.map(h => `
    <div class="highlight-card ${h.type || 'neutral'}">
      <h4>${h.title}</h4>
      <p>${h.description}</p>
    </div>
    `).join('')}
  </div>
  ` : ''}

  ${recommendation.analysis?.risks && recommendation.analysis.risks.length > 0 ? `
  <h2>Risks & Concerns</h2>
  <div class="risks-section">
    ${recommendation.analysis.risks.map(r => `
    <div class="risk-card">
      <span class="severity ${r.severity || 'medium'}">${r.severity || 'MEDIUM'}</span>
      <div>
        <h4>${r.title}</h4>
        <p>${r.description}</p>
      </div>
    </div>
    `).join('')}
  </div>
  ` : ''}

  <h2>Strategic Recommendations</h2>
  <div class="rec-grid">
    ${recommendation.recommendations?.map(rec => `
    <div class="rec-card">
      <div class="header">
        <span class="score ${rec.priority_score >= 8 ? 'high' : rec.priority_score >= 5 ? 'medium' : 'low'}">
          Priority ${rec.priority_score || 5}/10
        </span>
        <span class="category">${rec.category || 'General'}</span>
      </div>
      <h4>${rec.title}</h4>
      <p class="description">${rec.description}</p>
      ${rec.impact ? `<div class="impact">Expected Impact: ${rec.impact}</div>` : ''}
    </div>
    `).join('') || '<p>No recommendations available.</p>'}
  </div>

  <div class="footer">
    <p>Gym Capstone - Analytics Dashboard | Business Recommendation Report</p>
  </div>
</body>
</html>
    `;

    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const printWindow = window.open(url, '_blank');
if (printWindow) {
      printWindow.onload = function() {
        printWindow.print();
      };
    }
  };

  const viewRecommendation = (rec) => {
    setSelectedRecommendation(rec);
    setShowViewModal(true);
  };

  const handleExportCSV = () => {
    if (!analytics) return;
    
    const data = analytics.revenueByMonth;
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Month,Revenue,Bookings\n"
      + data.map(row => `${row.month},${row.revenue},${row.count}`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `analytics_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  function getDateRange(range) {
  const end_date = new Date();
  const start_date = new Date();

  switch (range) {
    case "1_month":
      start_date.setMonth(start_date.getMonth() - 1);
      break;

    case "3_months":
      start_date.setMonth(start_date.getMonth() - 3);
      break;

    case "6_months":
      start_date.setMonth(start_date.getMonth() - 6);
      break;

    default:
      throw new Error("Invalid range selected");
  }

  return { start_date, end_date };
}

  const requestBusinessRecommendation = async () => {
    // Validate custom date range
    if (selectedRange === "custom") {
      if (!customStartDate || !customEndDate) {
        error("Please select both start and end dates for custom range");
        return;
      }
      if (new Date(customStartDate) > new Date(customEndDate)) {
        error("Start date must be before end date");
        return;
      }
    }

    try {
      setRecommendationLoading(true);
      const body = {};
      
      if (selectedRange === "custom" && customStartDate && customEndDate) {
        body.start_date = customStartDate;
        body.end_date = customEndDate;
      } else {
        const { start_date, end_date } = getDateRange(selectedRange);
        body.start_date = start_date;
        body.end_date = end_date;
      }
      
      const response = await api.post("/ai/business-recommendation", body);
      console.log("Business recommendation response:", response.data);
      setBusinessRecommendation(response.data);
      success("Business recommendation generated successfully!");
    } catch (err) {
      console.error("Error generating business recommendation:", err);
      error(err.response?.data?.message || "Failed to generate business recommendation");
    } finally {
      setRecommendationLoading(false);
    }
  };

  const formatCurrency = (value) => `₱${(value || 0).toLocaleString()}`;

  const metricCards = analytics ? [
    {
      title: "Total Clients",
      value: analytics.overview.totalClients,
      change: null,
      icon: Users,
      color: "bg-blue-600",
      description: "Total registered clients in the system"
    },
    {
      title: "Active Memberships",
      value: analytics.overview.activeMemberships,
      change: null,
      icon: CreditCard,
      color: "bg-green-600",
      description: "Currently active memberships"
    },
    {
      title: "This Month Revenue",
      value: formatCurrency(analytics.overview.thisMonthRevenue),
      change: analytics.overview.revenueGrowth,
      icon: DollarSign,
      color: "bg-red-600",
      description: analytics.overview.revenueGrowth >= 0 
        ? `${analytics.overview.revenueGrowth}% increase from last month`
        : `${Math.abs(analytics.overview.revenueGrowth)}% decrease from last month`
    },
    {
      title: "Active Classes",
      value: analytics.overview.activeClasses,
      change: null,
      icon: Calendar,
      color: "bg-purple-600",
      description: "Scheduled classes for today"
    },
    {
      title: "Total Bookings",
      value: analytics.overview.totalBookings,
      change: null,
      icon: Activity,
      color: "bg-orange-600",
      description: "All time class and trainer bookings"
    },
    {
      title: "Pending Requests",
      value: analytics.overview.pendingRequests,
      change: null,
      icon: Filter,
      color: "bg-yellow-600",
      description: "Discount requests awaiting approval"
    }
  ] : [];

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-10 h-10 text-red-600 animate-spin" />
          <span className="text-slate-400">Loading analytics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Analytics Dashboard</h1>
          <p className="text-slate-400 mt-1">Track performance metrics and trends</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(Number(e.target.value))}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-red-500"
          >
            <option value={3}>Last 3 months</option>
            <option value={6}>Last 6 months</option>
            <option value={12}>Last 12 months</option>
          </select>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={fetchAnalytics}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-700/60 hover:bg-slate-600/80 backdrop-blur-sm text-white rounded-lg transition border border-white/10"
          >
            <RefreshCw className="w-5 h-5" />
            Refresh
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {metricCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/10 p-4"
          >
            <div className={`w-10 h-10 ${card.color} rounded-lg flex items-center justify-center mb-3`}>
              <card.icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-xs text-slate-400 mb-1">{card.title}</p>
            <div className="flex items-center gap-2">
              <p className="text-xl font-bold text-white">{card.value}</p>
              {card.change !== null && (
                <span className={`flex items-center text-xs ${card.change >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {card.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {Math.abs(card.change)}%
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">{card.description}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <div className="bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Revenue Trend</h3>
          <p className="text-sm text-slate-400 mb-4">Monthly revenue over the last {dateRange} months</p>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={analytics?.revenueByMonth || []}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#dc2626" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#dc2626" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={(value) => `₱${value/1000}k`} />
              <Tooltip 
                contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "8px" }}
                labelStyle={{ color: "#fff" }}
                formatter={(value) => [`₱${value.toLocaleString()}`, "Revenue"]}
              />
              <Area type="monotone" dataKey="revenue" stroke="#dc2626" fill="url(#revenueGradient)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Bookings by Type */}
        <div className="bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Bookings by Type</h3>
          <p className="text-sm text-slate-400 mb-4">Class bookings vs Trainer sessions</p>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analytics?.bookingsByType || []}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {(analytics?.bookingsByType || []).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "8px" }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Client Growth */}
        <div className="bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Client Growth</h3>
          <p className="text-sm text-slate-400 mb-4">New client registrations over time</p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics?.clientGrowth || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip 
                contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "8px" }}
                labelStyle={{ color: "#fff" }}
              />
              <Bar dataKey="clients" fill="#16a34a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Membership Status */}
        <div className="bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Membership Status</h3>
          <p className="text-sm text-slate-400 mb-4">Current membership breakdown</p>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analytics?.membershipStatus || []}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {(analytics?.membershipStatus || []).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "8px" }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Trainers & Popular Classes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Popular Classes */}
        <div className="bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Most Popular Classes</h3>
          <p className="text-sm text-slate-400 mb-4">Top 10 booked classes</p>
          <div className="space-y-3">
            {(analytics?.classPopularity || []).length === 0 ? (
              <p className="text-slate-400">No class data available</p>
            ) : (
              analytics.classPopularity.map((cls, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center text-xs text-white">
                      {index + 1}
                    </span>
                    <span className="text-white">{cls.name}</span>
                  </div>
                  <span className="text-slate-400">{cls.count} bookings</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Trainers */}
        <div className="bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Top Performing Trainers</h3>
          <p className="text-sm text-slate-400 mb-4">Trainers with most sessions</p>
          <div className="space-y-3">
            {(analytics?.topTrainers || []).length === 0 ? (
              <p className="text-slate-400">No trainer data available</p>
            ) : (
              analytics.topTrainers.map((trainer, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center text-xs text-white">
                      {index + 1}
                    </span>
                    <span className="text-white">{trainer.name}</span>
                  </div>
                  <span className="text-slate-400">{trainer.count} sessions</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Business Recommendation Section */}
      <div className="bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl flex items-center justify-center">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Business Recommendation</h3>
            <p className="text-sm text-slate-400">AI-powered business insights and recommendations</p>
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-4 mb-6">
          <div>
            <label className="block text-sm text-slate-400 mb-2">Date Range</label>
            <select
              value={selectedRange}
              onChange={(e) => setSelectedRange(e.target.value)}
              className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500"
            >
              <option value="1_month">Last 1 Month</option>
              <option value="3_months">Last 3 Months</option>
              <option value="6_months">Last 6 Months</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {selectedRange === "custom" && (
            <>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Start Date</label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className={`px-4 py-2 bg-slate-700 border rounded-lg text-white focus:outline-none focus:border-red-500 ${
                    !customStartDate ? 'border-red-500' : 'border-slate-600'
                  }`}
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">End Date</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className={`px-4 py-2 bg-slate-700 border rounded-lg text-white focus:outline-none focus:border-red-500 ${
                    !customEndDate ? 'border-red-500' : 'border-slate-600'
                  }`}
                />
              </div>
            </>
          )}

          <button
            onClick={requestBusinessRecommendation}
            disabled={recommendationLoading}
            className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white rounded-lg transition disabled:opacity-50"
          >
            {recommendationLoading ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Bot className="w-4 h-4" />
                Generate Recommendation
                <span className="text-purple-200 text-xs">
                  ({selectedRange === "custom" && customStartDate && customEndDate 
                    ? `${customStartDate} → ${customEndDate}`
                    : `Last ${selectedRange.replace('_', ' ')}`})
                </span>
              </>
            )}
          </button>
        </div>

        {/* Business Recommendation Results */}
        {businessRecommendation && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Analysis Section - New Format */}
            {businessRecommendation.analysis && (
              <div className="space-y-6">
                {/* Summary */}
                <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-xl p-6 border border-slate-600">
                  <h4 className="text-lg font-semibold text-white mb-3">Executive Summary</h4>
                  <p className="text-slate-300 leading-relaxed">{businessRecommendation.analysis.summary}</p>
                </div>

                {/* Metrics Grid */}
                {businessRecommendation.analysis.metrics && businessRecommendation.analysis.metrics.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {businessRecommendation.analysis.metrics.map((metric, idx) => (
                      <div key={idx} className="bg-slate-700/50 rounded-xl p-4 text-center">
                        <div className={`text-2xl font-bold flex items-center justify-center gap-1 ${
                          metric.trend === 'up' ? 'text-green-400' : 
                          metric.trend === 'down' ? 'text-red-400' : 'text-slate-400'
                        }`}>
                          {metric.trend === 'up' && <ArrowUp className="w-5 h-5" />}
                          {metric.trend === 'down' && <ArrowDown className="w-5 h-5" />}
                          {metric.trend === 'neutral' && <Minus className="w-5 h-5" />}
                          {metric.value}
                        </div>
                        <div className="text-xs text-slate-400 mt-1">{metric.label}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Highlights */}
                {businessRecommendation.analysis.highlights && businessRecommendation.analysis.highlights.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-4">Highlights</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {businessRecommendation.analysis.highlights.map((highlight, idx) => (
                        <div key={idx} className={`rounded-xl p-4 border-l-4 ${
                          highlight.type === 'positive' ? 'bg-green-500/10 border-green-500' :
                          highlight.type === 'warning' ? 'bg-yellow-500/10 border-yellow-500' :
                          'bg-slate-700/50 border-slate-500'
                        }`}>
                          <div className="flex items-center gap-2 mb-2">
                            {highlight.type === 'positive' && <CheckCircle className="w-4 h-4 text-green-500" />}
                            {highlight.type === 'warning' && <AlertTriangle className="w-4 h-4 text-yellow-500" />}
                            {(!highlight.type || highlight.type === 'neutral') && <Minus className="w-4 h-4 text-slate-500" />}
                            <span className="text-sm font-medium text-white">{highlight.title}</span>
                          </div>
                          <p className="text-sm text-slate-400">{highlight.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Risks */}
                {businessRecommendation.analysis.risks && businessRecommendation.analysis.risks.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-4">Risks & Concerns</h4>
                    <div className="space-y-3">
                      {businessRecommendation.analysis.risks.map((risk, idx) => (
                        <div key={idx} className="flex items-start gap-3 bg-red-500/10 rounded-lg p-4 border-l-4 border-red-500">
                          <span className={`px-2 py-1 text-xs font-medium rounded ${
                            risk.severity === 'high' ? 'bg-red-600 text-white' :
                            risk.severity === 'medium' ? 'bg-yellow-600 text-white' :
                            'bg-green-600 text-white'
                          }`}>
                            {risk.severity?.toUpperCase() || 'MEDIUM'}
                          </span>
                          <div>
                            <h5 className="font-medium text-white">{risk.title}</h5>
                            <p className="text-sm text-slate-400">{risk.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Recommendations Section - New Format */}
            {businessRecommendation.recommendations && businessRecommendation.recommendations.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold text-white mb-4">Strategic Recommendations</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {businessRecommendation.recommendations.map((rec, idx) => (
                    <div key={idx} className="bg-slate-700/30 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                          rec.priority_score >= 8 ? 'bg-red-600/20 text-red-400' :
                          rec.priority_score >= 5 ? 'bg-yellow-600/20 text-yellow-400' :
                          'bg-green-600/20 text-green-400'
                        }`}>
                          Priority {rec.priority_score || 5}/10
                        </span>
                        <span className="text-xs text-slate-400 uppercase">{rec.category}</span>
                      </div>
                      <h5 className="font-medium text-white mb-2">{rec.title}</h5>
                      <p className="text-sm text-slate-400 mb-3">{rec.description}</p>
                      {rec.impact && (
                        <div className="flex items-center gap-2 pt-3 border-t border-slate-600">
                          <Zap className="w-4 h-4 text-green-400" />
                          <span className="text-sm text-green-400">Impact: {rec.impact}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Recommendation History Table */}
      <div className="bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-white">Recommendation History</h3>
            <p className="text-sm text-slate-400">Past business recommendations</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-700/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Range</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Summary</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {recommendationHistory.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-4 py-8 text-center text-slate-400">
                    No recommendation history found
                  </td>
                </tr>
              ) : (
                recommendationHistory.map((rec, idx) => (
                  <tr key={idx} className="hover:bg-slate-700/30">
                    <td className="px-4 py-3 text-sm text-white">
                      {rec.createdAt ? new Date(rec.createdAt).toLocaleDateString() : "N/A"}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300">
                      {rec.date_range || rec.range || "N/A"}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300 max-w-md truncate">
                      {rec.analysis?.summary?.substring(0, 100) || "N/A"}...
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => viewRecommendation(rec)}
                          className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleExportPDF(rec)}
                          className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition"
                          title="Export PDF"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Recommendation Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Business Recommendation Details"
        size="lg"
      >
        {selectedRecommendation && (
          <div className="space-y-6 max-h-[70vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-700 pb-4">
              <div>
                <p className="text-sm text-slate-400">Date Range</p>
                <p className="text-white">{selectedRecommendation.date_range || selectedRecommendation.range || "N/A"}</p>
              </div>
              <button
                onClick={() => handleExportPDF(selectedRecommendation)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
              >
                <FileText className="w-4 h-4" />
                Export
              </button>
            </div>

            {selectedRecommendation.analysis && (
              <div className="space-y-6">
                {/* Summary */}
                <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-xl p-4 border border-slate-600">
                  <h4 className="text-lg font-semibold text-white mb-3">Executive Summary</h4>
                  <p className="text-slate-300 leading-relaxed">{selectedRecommendation.analysis.summary}</p>
                </div>

                {/* Metrics */}
                {selectedRecommendation.analysis.metrics && selectedRecommendation.analysis.metrics.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {selectedRecommendation.analysis.metrics.map((m, i) => (
                      <div key={i} className="bg-slate-700/50 rounded-lg p-3 text-center">
                        <div className={`text-xl font-bold flex items-center justify-center gap-1 ${
                          m.trend === 'up' ? 'text-green-400' : m.trend === 'down' ? 'text-red-400' : 'text-slate-400'
                        }`}>
                          {m.trend === 'up' && <ArrowUp className="w-4 h-4" />}
                          {m.trend === 'down' && <ArrowDown className="w-4 h-4" />}
                          {m.trend === 'neutral' && <Minus className="w-4 h-4" />}
                          {m.value}
                        </div>
                        <div className="text-xs text-slate-400">{m.label}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Highlights */}
                {selectedRecommendation.analysis.highlights && selectedRecommendation.analysis.highlights.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedRecommendation.analysis.highlights.map((h, i) => (
                      <div key={i} className={`rounded-lg p-3 border-l-4 ${
                        h.type === 'positive' ? 'bg-green-500/10 border-green-500' :
                        h.type === 'warning' ? 'bg-yellow-500/10 border-yellow-500' :
                        'bg-slate-700/50 border-slate-500'
                      }`}>
                        <div className="flex items-center gap-2 mb-1">
                          {h.type === 'positive' && <CheckCircle className="w-3 h-3 text-green-500" />}
                          {h.type === 'warning' && <AlertTriangle className="w-3 h-3 text-yellow-500" />}
                          <span className="text-xs font-medium text-white">{h.title}</span>
                        </div>
                        <p className="text-xs text-slate-400">{h.description}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Risks */}
                {selectedRecommendation.analysis.risks && selectedRecommendation.analysis.risks.length > 0 && (
                  <div className="space-y-2">
                    {selectedRecommendation.analysis.risks.map((r, i) => (
                      <div key={i} className="flex items-start gap-2 bg-red-500/10 rounded-lg p-3 border-l-4 border-red-500">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                          r.severity === 'high' ? 'bg-red-600 text-white' :
                          r.severity === 'medium' ? 'bg-yellow-600 text-white' :
                          'bg-green-600 text-white'
                        }`}>{r.severity?.toUpperCase()}</span>
                        <div>
                          <div className="font-medium text-white text-sm">{r.title}</div>
                          <div className="text-xs text-slate-400">{r.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {selectedRecommendation.recommendations && selectedRecommendation.recommendations.length > 0 && (
              <div className="space-y-4 mt-6">
                <h4 className="text-lg font-semibold text-white">Strategic Recommendations</h4>
                <div className="grid grid-cols-1 gap-3">
                  {selectedRecommendation.recommendations.map((rec, idx) => (
                    <div key={idx} className="bg-slate-700/30 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                          rec.priority_score >= 8 ? 'bg-red-600/20 text-red-400' :
                          rec.priority_score >= 5 ? 'bg-yellow-600/20 text-yellow-400' :
                          'bg-green-600/20 text-green-400'
                        }`}>Priority {rec.priority_score || 5}/10</span>
                        <span className="text-xs text-slate-400 uppercase">{rec.category}</span>
                      </div>
                      <h5 className="font-medium text-white mb-1">{rec.title}</h5>
                      <p className="text-sm text-slate-400 mb-2">{rec.description}</p>
                      {rec.impact && (
                        <div className="flex items-center gap-1 text-xs text-green-400">
                          <Zap className="w-3 h-3" /> Impact: {rec.impact}
                        </div>
                      )}
                      {rec.expected_impact && (
                        <p className="text-xs text-green-400 mt-2">Expected Impact: {rec.expected_impact}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}