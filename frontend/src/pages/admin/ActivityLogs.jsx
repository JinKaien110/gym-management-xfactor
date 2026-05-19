
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Activity,
  Users,
  CreditCard,
  Settings,
  Calendar,
  UserCog,
  Filter,
  Download,
  RefreshCw,
  Search,
  ChevronDown,
  ArrowUpDown,
  FileText,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Eye
} from "lucide-react";
import api from "../../api/axios.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useNotification } from "../../context/NotificationContext.jsx";
import Modal from "../../components/Modal.jsx";

const ENTITY_ICONS = {
  auth: Users,
  client: Users,
  membership: CreditCard,
  booking: Calendar,
  trainer: UserCog,
  class: Calendar,
  payment: CreditCard,
  discount: CreditCard,
  schedule: Calendar,
  settings: Settings,
  default: Activity
};

const STATUS_COLORS = {
  success: "bg-green-500/20 text-green-400 border-green-500/30",
  fail: "bg-red-500/20 text-red-400 border-red-500/30",
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
};

const ACTION_COLORS = {
  login: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  logout: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  create: "bg-green-500/20 text-green-400 border-green-500/30",
  update: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  delete: "bg-red-500/20 text-red-400 border-red-500/30",
  freeze: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  unfreeze: "bg-pink-500/20 text-pink-400 border-pink-500/30",
  approve: "bg-green-500/20 text-green-400 border-green-500/30",
  reject: "bg-red-500/20 text-red-400 border-red-500/30",
  purchase: "bg-green-500/20 text-green-400 border-green-500/30",
  refund: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  default: "bg-slate-500/20 text-slate-400 border-slate-500/30"
};

export default function ActivityLogs() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { error } = useNotification();

  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedLog, setSelectedLog] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 25,
    action: "",
    entity: "",
    actor_id: "",
    actor_role: "",
    start_date: "",
    end_date: ""
  });
  const [sortField, setSortField] = useState("createdAt");
  const [sortDirection, setSortDirection] = useState("desc");

  const entities = [
    { value: "", label: "All Entities" },
    { value: "auth", label: "Authentication" },
    { value: "client", label: "Client" },
    { value: "membership", label: "Membership" },
    { value: "booking", label: "Booking" },
    { value: "trainer", label: "Trainer" },
    { value: "class", label: "Class" },
    { value: "payment", label: "Payment" },
    { value: "discount", label: "Discount" },
    { value: "schedule", label: "Schedule" },
    { value: "settings", label: "Settings" }
  ];

  const actions = [
    { value: "", label: "All Actions" },
    { value: "LOGIN", label: "Login" },
    { value: "LOGOUT", label: "Logout" },
    { value: "CREATE", label: "Create" },
    { value: "UPDATE", label: "Update" },
    { value: "DELETE", label: "Delete" },
    { value: "FREEZE", label: "Freeze" },
    { value: "UNFREEZE", label: "Unfreeze" },
    { value: "APPROVE", label: "Approve" },
    { value: "REJECT", label: "Reject" },
    { value: "PURCHASE", label: "Purchase" },
    { value: "REFUND", label: "Refund" }
  ];

  const roles = [
    { value: "", label: "All Roles" },
    { value: "admin", label: "Admin" },
    { value: "superadmin", label: "Super Admin" },
    { value: "staff", label: "Staff" }
  ];

  const fetchLogs = async (pageOverride) => {
    try {
      setLoading(true);
      const params = { ...filters, page: pageOverride || filters.page };
      const response = await api.get("/admin/audit-logs", { params });
      setLogs(response.data.items || []);
      setTotalCount(response.data.total || 0);
    } catch (err) {
      console.error("Error fetching logs:", err);
      error("Failed to load activity logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/admin/login");
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchLogs();
    }
  }, [isAuthenticated]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= Math.ceil(totalCount / filters.limit)) {
      fetchLogs(newPage);
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleExportCSV = () => {
    if (!logs.length) return;

    const headers = [
      "Timestamp",
      "Action",
      "Entity",
      "Entity ID",
      "Actor",
      "Actor Role",
      "Status",
      "Summary",
      "Changes",
      "Error"
    ];

    const rows = logs.map((log) => [
      new Date(log.createdAt).toLocaleString(),
      log.action || "",
      log.entity || "",
      log.entity_id || "",
      log.actor?.name || log.actor?.email || "System",
      log.actor?.role || "",
      log.status || "",
      log.summary || "",
      JSON.stringify(log.changes || ""),
      log.error?.message || ""
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers, ...rows].map((row) => row.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `activity-logs-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getActionColor = (action) => {
    const key = (action || "").toLowerCase();
    return ACTION_COLORS[key] || ACTION_COLORS.default;
  };

  const getEntityIcon = (entity) => {
    const key = (entity || "").toLowerCase();
    return ENTITY_ICONS[key] || ENTITY_ICONS.default;
  };

  const getStatusBadge = (status) => {
    const colors = STATUS_COLORS[status] || STATUS_COLORS.pending;
    const icons = {
      success: CheckCircle,
      fail: XCircle,
      pending: Clock
    };
    const Icon = icons[status] || Clock;
    const labels = {
      success: "Success",
      fail: "Failed",
      pending: "Pending"
    };

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${colors}`}
      >
        <Icon className="w-3 h-3" />
        {labels[status] || status}
      </span>
    );
  };

  const formatTimestamp = (dateStr) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  };

  const totalPages = Math.ceil(totalCount / filters.limit);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Activity Logs</h1>
          <p className="text-slate-400 mt-1">Track and audit all system activities</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            disabled={loading || !logs.length}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700/60 hover:bg-slate-600/80 text-white rounded-lg transition border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={() => fetchLogs(1)}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-700/60 hover:bg-slate-600/80 backdrop-blur-sm text-white rounded-lg transition border border-white/10 disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Overview - from recent items */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/60 backdrop-blur-xl rounded-2xl p-5 border border-white/10 shadow-xl shadow-black/20"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-blue-500/20 rounded-xl">
              <Activity className="w-5 h-5 text-blue-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">{totalCount.toLocaleString()}</p>
          <p className="text-sm text-slate-400">Total Activities</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-800/60 backdrop-blur-xl rounded-2xl p-5 border border-white/10 shadow-xl shadow-black/20"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-green-500/20 rounded-xl">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">
            {logs.filter((l) => l.status === "success").length.toLocaleString()}
          </p>
          <p className="text-sm text-slate-400">Successful</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-800/60 backdrop-blur-xl rounded-2xl p-5 border border-white/10 shadow-xl shadow-black/20"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-red-500/20 rounded-xl">
              <XCircle className="w-5 h-5 text-red-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">
            {logs.filter((l) => l.status === "fail").length.toLocaleString()}
          </p>
          <p className="text-sm text-slate-400">Failed</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-slate-800/60 backdrop-blur-xl rounded-2xl p-5 border border-white/10 shadow-xl shadow-black/20"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-slate-500/20 rounded-xl">
              <Filter className="w-5 h-5 text-slate-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">
            {new Set(logs.map((l) => l.entity).filter(Boolean)).size}
          </p>
          <p className="text-sm text-slate-400">Entity Types</p>
        </motion.div>
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-800/60 backdrop-blur-xl rounded-2xl p-5 border border-white/10"
      >
        <div className="flex items-center gap-3 mb-4">
          <Filter className="w-5 h-5 text-slate-400" />
          <h3 className="text-lg font-semibold text-white">Filters</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Action</label>
            <div className="relative">
              <select
                value={filters.action}
                onChange={(e) => handleFilterChange("action", e.target.value)}
                className="w-full appearance-none px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-red-500 transition"
              >
                {actions.map((a) => (
                  <option key={a.value} value={a.value} className="bg-slate-700">
                    {a.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Entity</label>
            <div className="relative">
              <select
                value={filters.entity}
                onChange={(e) => handleFilterChange("entity", e.target.value)}
                className="w-full appearance-none px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-red-500 transition"
              >
                {entities.map((e) => (
                  <option key={e.value} value={e.value} className="bg-slate-700">
                    {e.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Actor Role</label>
            <div className="relative">
              <select
                value={filters.actor_role}
                onChange={(e) => handleFilterChange("actor_role", e.target.value)}
                className="w-full appearance-none px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-red-500 transition"
              >
                {roles.map((r) => (
                  <option key={r.value} value={r.value} className="bg-slate-700">
                    {r.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Date Range</label>
            <div className="flex gap-2">
              <input
                type="date"
                value={filters.start_date}
                onChange={(e) => handleFilterChange("start_date", e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-red-500 transition"
              />
              <input
                type="date"
                value={filters.end_date}
                onChange={(e) => handleFilterChange("end_date", e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-red-500 transition"
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Logs Table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/10 shadow-xl shadow-black/20 overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-700/50">
              <tr>
                {[
                  { key: "createdAt", label: "Timestamp", sortable: true },
                  { key: "action", label: "Action", sortable: true },
                  { key: "entity", label: "Entity", sortable: true },
                  { key: "actor", label: "Actor", sortable: false },
                  { key: "status", label: "Status", sortable: true },
                  { key: "summary", label: "Summary", sortable: false },
                  { key: "details", label: "Details", sortable: false },
                ].map((col) => (
                  <th
                    key={col.key}
                    onClick={() => col.sortable && handleSort(col.key)}
                    className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider cursor-pointer select-none whitespace-nowrap hover:text-white transition"
                  >
                    <div className="flex items-center gap-2">
                      {col.label}
                      {col.sortable && (
                        <ArrowUpDown
                          className={`w-4 h-4 ${sortField === col.key ? "text-red-400" : "text-slate-600"}`}
                        />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <RefreshCw className="w-8 h-8 text-red-600 animate-spin" />
                      <p className="text-slate-400">Loading activity logs...</p>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <Activity className="w-12 h-12 text-slate-600" />
                      <p className="text-slate-400">No activity logs found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log, idx) => {
                  const EntityIcon = getEntityIcon(log.entity);
                  return (
                    <motion.tr
                      key={log._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.02 }}
                      className="hover:bg-slate-700/50 transition-colors cursor-pointer group"
                      onClick={() => {
                        setSelectedLog(log);
                        setShowDetailModal(true);
                      }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-slate-300">
                          {formatTimestamp(log.createdAt)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getActionColor(log.action)}`}>
                          {log.action || "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded bg-slate-700/50">
                            <EntityIcon className="w-4 h-4 text-slate-400" />
                          </div>
                          <span className="text-sm text-slate-300 capitalize">{log.entity || "N/A"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {log.actor?.profilePic ? (
                            <img
                              src={log.actor.profilePic}
                              alt="Actor"
                              className="w-6 h-6 rounded-full"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-slate-600 flex items-center justify-center text-xs text-slate-300">
                              {(log.actor?.name?.[0] || log.actor?.email?.[0] || "S").toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-sm text-white truncate max-w-[120px]">
                              {log.actor?.name || log.actor?.email || "System"}
                            </p>
                            <p className="text-xs text-slate-500 capitalize">{log.actor?.role || "N/A"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(log.status)}
                      </td>
                      <td className="px-6 py-4 max-w-[250px]">
                        <p className="text-sm text-slate-300 truncate" title={log.summary}>
                          {log.summary || "N/A"}
                        </p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Eye className="w-4 h-4 text-slate-500 group-hover:text-red-400 transition-colors" />
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && totalCount > 0 && (
          <div className="px-6 py-4 border-t border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-400">
              Showing <span className="text-white font-medium">{Math.min((filters.page - 1) * filters.limit + 1, totalCount)}</span> to{" "}
              <span className="text-white font-medium">{Math.min(filters.page * filters.limit, totalCount)}</span> of{" "}
              <span className="text-white font-medium">{totalCount.toLocaleString()}</span> entries
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(filters.page - 1)}
                disabled={filters.page <= 1}
                className="px-3 py-1.5 bg-slate-700/50 border border-slate-600 rounded-lg text-sm text-white hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Previous
              </button>
              <span className="text-sm text-slate-400">
                Page {filters.page} of {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(filters.page + 1)}
                disabled={filters.page >= totalPages}
                className="px-3 py-1.5 bg-slate-700/50 border border-slate-600 rounded-lg text-sm text-white hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="Activity Log Details"
        size="lg"
      >
        {selectedLog && (
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-700">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-slate-700/50 rounded-xl">
                  {(() => {
                    const EntityIcon = getEntityIcon(selectedLog.entity);
                    return <EntityIcon className="w-6 h-6 text-slate-400" />;
                  })()}
                </div>
                <div>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getActionColor(selectedLog.action)}`}>
                    {selectedLog.action || "N/A"}
                  </span>
                  <p className="text-slate-400 text-sm mt-1">{selectedLog.entity || "N/A"}</p>
                </div>
              </div>
              {getStatusBadge(selectedLog.status)}
            </div>

            {/* Key Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-700/30 rounded-lg p-4">
                <p className="text-xs text-slate-500 mb-1">Timestamp</p>
                <p className="text-white text-sm">{formatTimestamp(selectedLog.createdAt)}</p>
              </div>
              <div className="bg-slate-700/30 rounded-lg p-4">
                <p className="text-xs text-slate-500 mb-1">Entity ID</p>
                <p className="text-white text-sm font-mono text-xs break-all">{selectedLog.entity_id || "N/A"}</p>
              </div>
              {selectedLog.actor && (
                <>
                  <div className="bg-slate-700/30 rounded-lg p-4">
                    <p className="text-xs text-slate-500 mb-1">Actor</p>
                    <p className="text-white text-sm">{selectedLog.actor.name || selectedLog.actor.email || "System"}</p>
                  </div>
                  <div className="bg-slate-700/30 rounded-lg p-4">
                    <p className="text-xs text-slate-500 mb-1">Actor Role</p>
                    <p className="text-white text-sm capitalize">{selectedLog.actor.role || "N/A"}</p>
                  </div>
                </>
              )}
            </div>

            {/* Summary */}
            <div className="bg-slate-700/30 rounded-lg p-4">
              <p className="text-xs text-slate-500 mb-1">Summary</p>
              <p className="text-white">{selectedLog.summary || "No summary available"}</p>
            </div>

            {/* Changes */}
            {selectedLog.changes && Object.keys(selectedLog.changes).length > 0 && (
              <div className="bg-slate-700/30 rounded-lg p-4">
                <p className="text-xs text-slate-500 mb-2">Changes</p>
                <div className="space-y-2">
                  {Object.entries(selectedLog.changes).map(([key, value]) => (
                    <div key={key} className="bg-slate-800/50 rounded p-2 text-sm">
                      <span className="text-slate-400">{key}:</span>{" "}
                      <span className="text-slate-300">
                        {typeof value === "object" ? JSON.stringify(value, null, 2) : String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Error */}
            {selectedLog.status === "fail" && selectedLog.error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-red-400" />
                  <p className="text-xs text-red-400 uppercase">Error Details</p>
                </div>
                <p className="text-red-400 text-sm mb-1">{selectedLog.error.message}</p>
                {selectedLog.error.code && (
                  <p className="text-red-500 text-xs">Code: {selectedLog.error.code}</p>
                )}
              </div>
            )}

            {/* Meta */}
            {selectedLog.meta && Object.keys(selectedLog.meta).length > 0 && (
              <div className="bg-slate-700/30 rounded-lg p-4">
                <p className="text-xs text-slate-500 mb-2">Metadata</p>
                <div className="space-y-2">
                  {Object.entries(selectedLog.meta).map(([key, value]) => (
                    <div key={key} className="bg-slate-800/50 rounded p-2 text-sm">
                      <span className="text-slate-400">{key}:</span>{" "}
                      <span className="text-slate-300">
                        {typeof value === "object" ? JSON.stringify(value, null, 2) : String(value)}
                      </span>
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
