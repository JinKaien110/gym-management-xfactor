import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Settings, 
  Search, 
  RefreshCw,
  Edit, 
  Plus,
  ToggleLeft,
  ToggleRight,
  Archive,
  X,
  Check,
  DollarSign,
  Calendar,
  Clock,
  List
} from "lucide-react";
import api from "../../api/axios.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useNotification } from "../../context/NotificationContext.jsx";
import ucfirst from "../../utils/ucfirst.js";

export default function membershipConfig() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { success, error } = useNotification();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/admin/login");
    }
  }, [isAuthenticated, navigate]);

  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingConfig, setEditingConfig] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    perks: [],
    fee: "",
    duration: "",
    duration_days: ""
  });

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append("page", pagination.page);
      params.append("limit", pagination.limit);
      if (search) params.append("search", search);
      if (statusFilter) params.append("status", statusFilter);

      const response = await api.get(`/admin/membership-config?${params.toString()}`);
      console.log("membership Config response:", response.data);
      setConfigs(response.data.result || response.data.data || []);
      setPagination(prev => ({
        ...prev,
        total: response.data.total || 0,
        totalPages: response.data.totalPages || response.data.pages || 0
      }));
    } catch (err) {
      console.error("Error fetching membership configs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, [pagination.page, search, statusFilter]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      
      const payload = {
        ...formData,
        fee: Number(formData.fee),
        duration_days: Number(formData.duration_days),
        perks: formData.perks.filter(p => p.trim())
      };
      console.log(payload)

      const response = await api.post("/admin/membership-config", payload);
      setShowAddModal(false);
      setFormData({ name: "", perks: [""], fee: "", duration: "", duration_days: "" });
      success(response.data?.message || "membership config created successfully");
      fetchConfigs();
    } catch (err) {
      console.error("Error creating membership config:", err);
      error(err.response?.data?.message || "Failed to create membership config");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (config) => {
    setEditingConfig(config);
    setFormData({
      name: config.name || "",
      perks: Array.isArray(config.perks) ? config.perks : [""],
      fee: Number(config.fee) || "",
      duration: config.duration || "",
      duration_days: Number(config.duration_days) || ""
    });
    setShowEditModal(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      
      const payload = {
        ...formData,
        fee: Number(formData.fee),
        duration_days: Number(formData.duration_days),
        perks: formData.perks.filter(p => p.trim())
      };
      
      const response = await api.patch(`/admin/membership-config/edit/${editingConfig._id}`, payload);
      setShowEditModal(false);
      setEditingConfig(null);
      setFormData({ name: "", perks: [""], fee: "", duration: "", duration_days: "" });
      success(response.data?.message || "membership config updated successfully");
      fetchConfigs();
    } catch (err) {
      console.error("Error updating membership config:", err);
      error(err.response?.data?.message || "Failed to update membership config");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (config) => {
    try {
      const newStatus = config.status === "active" ? "inactive" : "active";
      const response = await api.patch(`/admin/membership-config/status/${config._id}`, { status: newStatus });
      success(response.data?.message || "membership config status updated successfully");
      fetchConfigs();
    } catch (err) {
      console.error("Error updating membership config status:", err);
      error(err.response?.data?.message || "Failed to update membership config status");
    }
  };

  const handleArchive = async (config) => {
    if (!window.confirm("Are you sure you want to archive this membership config?")) return;
    try {
      const response = await api.patch(`/admin/membership-config/status/${config._id}`, { status: "archived" });
      success(response.data?.message || "membership config archived successfully");
      fetchConfigs();
    } catch (err) {
      console.error("Error archiving membership config:", err);
      error(err.response?.data?.message || "Failed to archive membership config");
    }
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Membership Config</h1>
          <p className="text-slate-400 mt-1">Manage membership configurations</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => fetchConfigs()}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-700/60 hover:bg-slate-600/80 backdrop-blur-sm text-white rounded-lg transition border border-white/10"
          >
            <RefreshCw className="w-5 h-5" />
            Refresh
          </button>
          <button
            onClick={() => {
              setFormData({ name: "", perks: [""], fee: "", duration: "", duration_days: "" });
              setShowAddModal(true);
            }}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
          >
            <Plus className="w-5 h-5" />
            Add New
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or duration..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-red-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPagination(prev => ({ ...prev, page: 1 }));
          }}
          className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-red-500"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Card Grid */}
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-20 text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin" />
          Loading...
        </div>
      ) : configs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Settings className="w-16 h-16 mb-4 opacity-50" />
          <p className="text-lg">No membership configs found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {configs.map((config) => (
            <motion.div
              key={config._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-800/60 backdrop-blur-xl rounded-xl border border-white/10 shadow-xl shadow-black/20 overflow-hidden hover:border-white/20 transition-all"
            >
              {/* Card Header */}
              <div className="p-4 border-b border-slate-700 flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">{config.name || "Unnamed"}</h3>
                  <p className="text-sm text-slate-400">v{config.version || 1}</p>
                </div>
                <button
                  onClick={() => handleToggleStatus(config)}
                  className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${
                    config.status === "active" 
                      ? "bg-green-600/20 text-green-400" 
                      : config.status === "archived"
                        ? "bg-yellow-600/20 text-yellow-400"
                        : "bg-slate-600/20 text-slate-400"
                  }`}
                >
                  {config.status === "active" ? (
                    <><ToggleRight className="w-4 h-4" /> Active</>
                  ) : config.status === "archived" ? (
                    <><Archive className="w-4 h-4" /> Archived</>
                  ) : (
                    <><ToggleLeft className="w-4 h-4" /> Inactive</>
                  )}
                </button>
              </div>

              {/* Card Body */}
              <div className="p-4 space-y-3">
                {/* Fee */}
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-red-600/20 flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-red-400" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Fee</p>
                    <p className="text-sm font-medium text-white">₱{config.fee?.toLocaleString() || "0"}</p>
                  </div>
                </div>

                {/* Duration */}
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-600/20 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Duration</p>
                    <p className="text-sm font-medium text-white">{config.duration || "N/A"} ({config.duration_days || 0} days)</p>
                  </div>
                </div>

                {/* Perks */}
                <div className="flex items-start gap-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-600/20 flex items-center justify-center">
                    <List className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-slate-400">Perks</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {Array.isArray(config.perks) && config.perks.length > 0 ? (
                        config.perks.slice(0, 3).map((perk, idx) => (
                          <span key={idx} className="px-2 py-0.5 text-xs bg-slate-700 text-slate-300 rounded">
                            {ucfirst(perk)}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-slate-500">No perks</span>
                      )}
                      {Array.isArray(config.perks) && config.perks.length > 3 && (
                        <span className="px-2 py-0.5 text-xs bg-slate-700 text-slate-400 rounded">
                          +{config.perks.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="p-4 border-t border-slate-700 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Created: {formatDate(config.createdAt)}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEdit(config)}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  {config.status !== "archived" && (
                    <button
                      onClick={() => handleArchive(config)}
                      className="p-2 text-slate-400 hover:text-yellow-400 hover:bg-slate-700 rounded-lg transition"
                      title="Archive"
                    >
                      <Archive className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-400">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} configs
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="px-3 py-1 bg-slate-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-600 transition"
            >
              Previous
            </button>
            <span className="text-sm text-white">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className="px-3 py-1 bg-slate-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-600 transition"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6 border-b border-slate-700 flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-bold text-white">Add membership Config</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-red-500"
                  placeholder="e.g., Basic, Premium, VIP"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Fee (₱)</label>
                <input
                  type="number"
                  value={formData.fee}
                  onChange={(e) => setFormData({ ...formData, fee: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-red-500"
                  placeholder="e.g., 1500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Duration</label>
                <input
                  type="text"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-red-500"
                  placeholder="e.g., 1 month"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Duration (Days)</label>
                <input
                  type="number"
                  value={formData.duration_days}
                  onChange={(e) => setFormData({ ...formData, duration_days: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-red-500"
                  placeholder="e.g., 30"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Perks / Benefits</label>
                <div className="space-y-2">
                  {formData.perks.map((perk, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={perk}
                        onChange={(e) => {
                          const newPerks = [...formData.perks];
                          newPerks[index] = e.target.value;
                          setFormData({ ...formData, perks: newPerks });
                        }}
                        className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-red-500"
                        placeholder="e.g., Gym access"
                      />
                      {formData.perks.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const newPerks = formData.perks.filter((_, i) => i !== index);
                            setFormData({ ...formData, perks: newPerks });
                          }}
                          className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg transition"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, perks: [...formData.perks, ""] })}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition"
                  >
                    <Plus className="w-4 h-4" />
                    Add Perk
                  </button>
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition disabled:opacity-50"
                >
                  {saving ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <Check className="w-5 h-5" />
                  )}
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingConfig && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6 border-b border-slate-700 flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-bold text-white">Edit membership Config</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingConfig(null);
                }}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdate} className="p-4 sm:p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-red-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Fee (₱)</label>
                <input
                  type="number"
                  value={formData.fee}
                  onChange={(e) => setFormData({ ...formData, fee: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-red-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Duration</label>
                <input
                  type="text"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-red-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Duration (Days)</label>
                <input
                  type="number"
                  value={formData.duration_days}
                  onChange={(e) => setFormData({ ...formData, duration_days: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-red-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Perks / Benefits</label>
                <div className="space-y-2">
                  {formData.perks.map((perk, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={perk}
                        onChange={(e) => {
                          const newPerks = [...formData.perks];
                          newPerks[index] = e.target.value;
                          setFormData({ ...formData, perks: newPerks });
                        }}
                        className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-red-500"
                        placeholder="e.g., Gym access"
                      />
                      {formData.perks.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const newPerks = formData.perks.filter((_, i) => i !== index);
                            setFormData({ ...formData, perks: newPerks });
                          }}
                          className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg transition"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, perks: [...formData.perks, ""] })}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition"
                  >
                    <Plus className="w-4 h-4" />
                    Add Perk
                  </button>
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingConfig(null);
                  }}
                  className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition disabled:opacity-50"
                >
                  {saving ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <Check className="w-5 h-5" />
                  )}
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
