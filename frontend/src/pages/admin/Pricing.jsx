import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  CreditCard, 
  Search, 
  RefreshCw,
  Edit, 
  Plus,
  ToggleLeft,
  ToggleRight,
  Package
} from "lucide-react";
import api from "../../api/axios.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useNotification } from "../../context/NotificationContext.jsx";

export default function Pricing() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { success, error } = useNotification();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/admin/login");
    }
  }, [isAuthenticated, navigate]);

  const [pricing, setPricing] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingPricing, setEditingPricing] = useState(null);
  const [formData, setFormData] = useState({
    plan_id: "",
    price: "",
    type: "regular"
  });

  const fetchPricing = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append("page", pagination.page);
      params.append("limit", pagination.limit);
      if (search) params.append("search", search);

      const response = await api.get(`/admin/pricing?${params.toString()}`);
      console.log("Pricing response:", response.data);
      setPricing(response.data.data || []);
      setPagination(prev => ({
        ...prev,
        total: response.data.total || 0,
        totalPages: response.data.pages || 0
      }));
    } catch (err) {
      console.error("Error fetching pricing:", err);
      error("Failed to fetch pricing");
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, planFilter, typeFilter, error]);

  const fetchPlans = useCallback(async () => {
    try {
      const response = await api.get("/plans?limit=100");
      setPlans(response.data.data || []);
    } catch (err) {
      console.error("Error fetching plans:", err);
      error("Failed to fetch plans");
    }
  }, [error]);

  useEffect(() => {
    fetchPricing();
    fetchPlans();
  }, [fetchPricing, fetchPlans]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.post("/pricing", formData);
      setShowAddModal(false);
      setFormData({
        plan_id: "",
        name: "",
        label: "",
        price: "",
        type: "regular"
      });
      success("Pricing created successfully");
      fetchPricing();
    } catch (err) {
      console.error("Error creating pricing:", err);
      error(err.response?.data?.message || "Failed to create pricing");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (p) => {
    setEditingPricing(p);
    setFormData({
      plan_id: p.plan_id?._id || p.plan_id || "",
      name: p.name || "",
      label: p.label || "",
      price: p.price?.toString() || "",
      type: p.type || "regular"
    });
    setShowEditModal(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.patch(`/pricing/${editingPricing._id}`, formData);
      setShowEditModal(false);
      setEditingPricing(null);
      setFormData({
        plan_id: "",
        name: "",
        label: "",
        price: "",
        type: "regular"
      });
      success("Pricing updated successfully");
      fetchPricing();
    } catch (err) {
      console.error("Error updating pricing:", err);
      error(err.response?.data?.message || "Failed to update pricing");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (p) => {
    try {
      const newStatus = p.status === "active" ? "inactive" : "active";
      await api.patch(`/pricing/${p._id}/status`, { status: newStatus });
      success("Pricing status updated successfully");
      fetchPricing();
    } catch (err) {
      console.error("Error updating pricing status:", err);
      error(err.response?.data?.message || "Failed to update pricing status");
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

  const getTypeBadge = (type) => {
    switch (type?.toLowerCase()) {
      case "regular":
        return "bg-blue-600/20 text-blue-400";
      case "discounted":
        return "bg-purple-600/20 text-purple-400";
      default:
        return "bg-slate-600/20 text-slate-400";
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Pricing</h1>
          <p className="text-slate-400 mt-1">Manage membership pricing</p>
        </div>
        <button
          onClick={() => {
            fetchPlans();
            setFormData({
              plan_id: "",
              price: "",
              type: "regular"
            });
            setShowAddModal(true);
          }}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
        >
          <Plus className="w-5 h-5" />
          New Pricing
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or label..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-red-500"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setPagination(prev => ({ ...prev, page: 1 }));
          }}
          className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-red-500"
        >
          <option value="">All Types</option>
          <option value="regular">Regular</option>
          <option value="discounted">Discounted</option>
        </select>
      </div>

      {/* Table */}
      <div className="fluid-card bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/10 shadow-xl shadow-black/20">
        <div className="table-wrapper overflow-auto">
          <table className="w-full table-sticky-header table-row-animated">
            <thead className="bg-slate-700/50">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Plan</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Price</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Type</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Loading pricing...
                    </div>
                  </td>
                </tr>
              ) : pricing.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-slate-400">
                    No pricing found
                  </td>
                </tr>
              ) : (
                pricing.map((p) => (
                  <motion.tr
                    key={p._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-slate-700/30"
                  >
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-slate-400" />
                        <div className="text-sm font-medium text-white">
                          {p.label || p.plan?.label || "N/A"}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-green-400">₱{p.price?.toLocaleString() || "0"}</div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeBadge(p.type)}`}>
                        {p.type === "regular" ? "Regular" : "Discounted"}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleStatus(p)}
                        className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${
                          p.status === "active" 
                            ? "bg-green-600/20 text-green-400" 
                            : "bg-slate-600/20 text-slate-400"
                        }`}
                      >
                        {p.status === "active" ? (
                          <><ToggleRight className="w-4 h-4" /> Active</>
                        ) : (
                          <><ToggleLeft className="w-4 h-4" /> Inactive</>
                        )}
                      </button>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleEdit(p)}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
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
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} pricing
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

      {/* Add Pricing Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Create Pricing</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Plan</label>
                <select
                  value={formData.plan_id}
                  onChange={(e) => setFormData({...formData, plan_id: e.target.value})}
                  required
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                >
                  <option value="">Select plan</option>
                  {plans.map((plan) => (
                    <option key={plan._id} value={plan._id}>
                      {plan.label} ({plan.duration || plan.duration_days} days)
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Price (₱)</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    required
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                    placeholder="e.g., 1500"
                  />
                </div>
                </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                >
                  <option value="regular">Regular</option>
                  <option value="discounted">Discounted</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition disabled:opacity-50"
                >
                  {saving ? "Creating..." : "Create Pricing"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Pricing Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Edit Pricing</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Plan</label>
                <select
                  value={formData.plan_id}
                  onChange={(e) => setFormData({...formData, plan_id: e.target.value})}
                  required
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                >
                  <option value="">Select plan</option>
                  {plans.map((plan) => (
                    <option key={plan._id} value={plan._id}>
                      {plan.label} ({plan.duration || plan.duration_days} days)
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Price (₱)</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    required
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                  />
                </div>
                </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                >
                  <option value="regular">Regular</option>
                  <option value="discounted">Discounted</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition disabled:opacity-50"
                >
                  {saving ? "Updating..." : "Update Pricing"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
