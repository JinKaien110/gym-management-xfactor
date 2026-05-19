import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Bot, 
  Search, 
  RefreshCw,
  Eye,
  CheckCircle,
  XCircle,
  RefreshCw as Regenerate,
  Calendar,
  User,
  UserCheck
} from "lucide-react";
import api from "../../api/axios.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useNotification } from "../../context/NotificationContext.jsx";

export default function AIRecommendations() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { success, error } = useNotification();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/admin/login");
    }
  }, [isAuthenticated, navigate]);

  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    status: "",
    client_id: "",
    trainer_id: "",
    start_date: "",
    end_date: ""
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [selectedRecommendation, setSelectedRecommendation] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append("page", pagination.page);
      params.append("limit", pagination.limit);
      
      if (search) params.append("search", search);
      if (filters.status) params.append("status", filters.status);
      if (filters.client_id) params.append("client_id", filters.client_id);
      if (filters.trainer_id) params.append("trainer_id", filters.trainer_id);
      if (filters.start_date) params.append("start_date", filters.start_date);
      if (filters.end_date) params.append("end_date", filters.end_date);

      const response = await api.get(`/admin/workout-recommendations?${params.toString()}`);
      console.log("AI Recommendations response:", response.data);
      
      const data = response.data;
      // Handle both response formats: { result, total, ... } or direct array
      const recommendationsData = Array.isArray(data) ? data : (data.result || data.data || []);
      setRecommendations(recommendationsData);
      setPagination(prev => ({
        ...prev,
        total: data.total || recommendationsData.length || 0,
        totalPages: data.totalPages || Math.ceil((data.total || recommendationsData.length || 0) / pagination.limit)
      }));
    } catch (err) {
      console.error("Error fetching AI recommendations:", err);
      error(err.response?.data?.message || "Failed to fetch recommendations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [pagination.page, search, filters.status, filters.client_id, filters.trainer_id, filters.start_date, filters.end_date]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  const handleDecision = async (id, decision) => {
    if (!window.confirm(`Are you sure you want to ${decision} this recommendation?`)) return;
    try {
      const response = await api.patch(`/ai/decision/${id}`, { decision });
      success(response.data?.result || `Recommendation ${decision} successfully`);
      fetchRecommendations();
      setShowDetailModal(false);
    } catch (err) {
      console.error("Error processing recommendation decision:", err);
      error(err.response?.data?.message || "Failed to process recommendation");
    }
  };

  const handleRegenerate = async (id) => {
    if (!window.confirm("Are you sure you want to regenerate this recommendation?")) return;
    try {
      const response = await api.post(`/ai/regenerate/${id}`);
      success(response.data?.result || "Recommendation regenerated successfully");
      fetchRecommendations();
      setShowDetailModal(false);
    } catch (err) {
      console.error("Error regenerating recommendation:", err);
      error(err.response?.data?.message || "Failed to regenerate recommendation");
    }
  };

  const handleViewDetails = (rec) => {
    // Use the data directly from the list since it already contains all required fields
    setSelectedRecommendation(rec);
    setShowDetailModal(true);
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return "bg-green-600/20 text-green-400";
      case "rejected":
        return "bg-red-600/20 text-red-400";
      case "pending":
        return "bg-yellow-600/20 text-yellow-400";
      default:
        return "bg-slate-600/20 text-slate-400";
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">AI Recommendations</h1>
          <p className="text-slate-400 mt-1">Manage AI workout recommendations</p>
        </div>
        <button
          onClick={() => fetchRecommendations()}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-700/60 hover:bg-slate-600/80 backdrop-blur-sm text-white rounded-lg transition border border-white/10"
        >
          <RefreshCw className="w-5 h-5" />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by client name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-red-500"
          />
        </div>
        
        {/* Status Filter */}
        <div className="relative">
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange("status", e.target.value)}
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-red-500 appearance-none"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {/* client ID Filter */}
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="client ID"
            value={filters.client_id}
            onChange={(e) => handleFilterChange("client_id", e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-red-500"
          />
        </div>

        {/* Trainer ID Filter */}
        <div className="relative">
          <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Trainer ID"
            value={filters.trainer_id}
            onChange={(e) => handleFilterChange("trainer_id", e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-red-500"
          />
        </div>

        {/* Start Date Filter */}
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="date"
            placeholder="Start Date"
            value={filters.start_date}
            onChange={(e) => handleFilterChange("start_date", e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-red-500 [color-scheme:dark]"
          />
        </div>

        {/* End Date Filter */}
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="date"
            placeholder="End Date"
            value={filters.end_date}
            onChange={(e) => handleFilterChange("end_date", e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-red-500 [color-scheme:dark]"
          />
        </div>
      </div>

      {/* Table */}
      <div className="fluid-card bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/10 shadow-xl shadow-black/20">
        <div className="table-wrapper overflow-auto">
          <table className="w-full table-sticky-header table-row-animated">
            <thead className="bg-slate-700/50">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">client</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider hidden md:table-cell">Trainer</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider hidden lg:table-cell">Title</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider hidden md:table-cell">Created</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Loading recommendations...
                    </div>
                  </td>
                </tr>
              ) : recommendations.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-400">
                    No AI recommendations found
                  </td>
                </tr>
              ) : (
                recommendations.map((rec) => (
                  <motion.tr
                    key={rec._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-slate-700/30"
                  >
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-purple-600/20 flex items-center justify-center text-purple-400">
                          <Bot className="w-5 h-5" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-white">
                            {rec.client?.first_name} {rec.client?.last_name}
                          </div>
                          <div className="text-xs text-slate-400 md:hidden">{formatDate(rec.createdAt)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden md:table-cell">
                      <div className="text-sm text-white">
                        {rec.trainer?.first_name ? `${rec.trainer.first_name} ${rec.trainer.last_name}` : "—"}
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                      <div className="text-sm text-white max-w-[200px] truncate">{rec.title || "—"}</div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden md:table-cell">
                      <div className="text-sm text-slate-400">{formatDate(rec.createdAt)}</div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(rec.status)}`}>
                        {rec.status?.charAt(0).toUpperCase() + rec.status?.slice(1)}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleViewDetails(rec)}
                          className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-3 sm:px-6 py-4 border-t border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs sm:text-sm text-slate-400 text-center sm:text-left">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} recommendations
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-2 sm:px-3 py-1 bg-slate-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-600 transition text-xs sm:text-sm"
              >
                <span className="hidden sm:inline">Previous</span>
                <span className="sm:hidden">{"<"}</span>
              </button>
              <div className="hidden sm:flex items-center gap-1">
                {[...Array(pagination.totalPages)].map((_, index) => {
                  const pageNum = index + 1;
                  if (
                    pageNum === 1 ||
                    pageNum === pagination.totalPages ||
                    (pageNum >= pagination.page - 1 && pageNum <= pagination.page + 1)
                  ) {
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-2 sm:px-3 py-1 rounded-lg transition text-xs sm:text-sm ${
                          pageNum === pagination.page
                            ? "bg-red-600 text-white"
                            : "bg-slate-700 text-white hover:bg-slate-600"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  } else if (
                    pageNum === pagination.page - 2 ||
                    pageNum === pagination.page + 2
                  ) {
                    return (
                      <span key={pageNum} className="px-1 text-slate-400">
                        ...
                      </span>
                    );
                  }
                  return null;
                })}
              </div>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="px-2 sm:px-3 py-1 bg-slate-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-600 transition text-xs sm:text-sm"
              >
                <span className="hidden sm:inline">Next</span>
                <span className="sm:hidden">{">"}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedRecommendation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Recommendation Details</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* ID and Version */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Recommendation ID</label>
                  <p className="text-white text-sm font-mono">{selectedRecommendation._id}</p>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Version</label>
                  <p className="text-white">v{selectedRecommendation.version || 1}</p>
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm text-slate-400 mb-1">Status</label>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(selectedRecommendation.status)}`}>
                  {selectedRecommendation.status?.charAt(0).toUpperCase() + selectedRecommendation.status?.slice(1)}
                </span>
              </div>

              {/* Created At */}
              <div>
                <label className="block text-sm text-slate-400 mb-1">Created At</label>
                <p className="text-white">{formatDate(selectedRecommendation.createdAt)}</p>
              </div>

              {/* client Info */}
              <div>
                <label className="block text-sm text-slate-400 mb-1">client</label>
                <div className="bg-slate-700/50 p-3 rounded-lg">
                  <p className="text-white font-medium">
                    {selectedRecommendation.client?.first_name} {selectedRecommendation.client?.last_name}
                  </p>
                  <p className="text-sm text-slate-400">{selectedRecommendation.client?.email}</p>
                </div>
              </div>

              {/* Trainer Info */}
              <div>
                <label className="block text-sm text-slate-400 mb-1">Trainer</label>
                <div className="bg-slate-700/50 p-3 rounded-lg">
                  {selectedRecommendation.trainer ? (
                    <>
                      <p className="text-white font-medium">
                        {selectedRecommendation.trainer.first_name} {selectedRecommendation.trainer.last_name}
                      </p>
                      <p className="text-sm text-slate-400">{selectedRecommendation.trainer.email}</p>
                    </>
                  ) : (
                    <p className="text-slate-400">Not assigned</p>
                  )}
                </div>
              </div>

              {/* Title */}
              {selectedRecommendation.title && (
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Title</label>
                  <p className="text-white font-medium">{selectedRecommendation.title}</p>
                </div>
              )}

              {/* Summary */}
              {selectedRecommendation.summary && (
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Summary</label>
                  <p className="text-white text-sm">{selectedRecommendation.summary}</p>
                </div>
              )}

              {/* Estimated Difficulty */}
              {selectedRecommendation.estimated_difficulty && (
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Estimated Difficulty</label>
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-600/20 text-blue-400">
                    {selectedRecommendation.estimated_difficulty}
                  </span>
                </div>
              )}

              {/* Trainer Decision */}
              {selectedRecommendation.trainer_decision && (
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Trainer Decision</label>
                  <div className="bg-slate-700/50 p-3 rounded-lg space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-400">Decision:</span>
                      {selectedRecommendation.trainer_decision.decision ? (
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusBadge(selectedRecommendation.trainer_decision.decision)}`}>
                          {selectedRecommendation.trainer_decision.decision}
                        </span>
                      ) : (
                        <span className="text-slate-400">Pending</span>
                      )}
                    </div>
                    {selectedRecommendation.trainer_decision.comment && (
                      <p className="text-sm text-white">{selectedRecommendation.trainer_decision.comment}</p>
                    )}
                    {selectedRecommendation.trainer_decision.decidedAt && (
                      <p className="text-xs text-slate-400">
                        Decided on {formatDate(selectedRecommendation.trainer_decision.decidedAt)}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
