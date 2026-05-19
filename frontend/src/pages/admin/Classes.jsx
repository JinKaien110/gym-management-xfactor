import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  BookOpen, 
  Search, 
  RefreshCw,
  Edit, 
  Plus,
  ToggleLeft,
  ToggleRight
} from "lucide-react";
import api from "../../api/axios.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useNotification } from "../../context/NotificationContext.jsx";

export default function Classes() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { success, error } = useNotification();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/admin/login");
    }
  }, [isAuthenticated, navigate]);

  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    default_capacity: ""
  });

   const fetchClasses = async () => {
     try {
       setLoading(true);
       const params = new URLSearchParams();
       params.append("page", pagination.page);
       params.append("limit", pagination.limit);
       if (search) params.append("search", search);

       const response = await api.get(`/admin/classes?${params.toString()}`);
       console.log("Classes response:", response.data);
       
       // Backend returns { result, total, totalPages, page, limit }
       const data = response.data;
       setClasses(data.result || data.data || []);
       setPagination(prev => ({
         ...prev,
         total: data.total || 0,
         totalPages: data.totalPages || 0
       }));
     } catch (err) {
       console.error("Error fetching classes:", err);
     } finally {
       setLoading(false);
     }
   };

  useEffect(() => {
    fetchClasses();
  }, [pagination.page, search]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const response = await api.post("/class", formData);
      setShowAddModal(false);
      setFormData({ name: "", default_capacity: "" });
      success("Class created successfully");
      fetchClasses();
    } catch (err) {
      console.error("Error creating class:", err);
      error(err.response?.data?.message || "Failed to create class");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (cls) => {
    setEditingClass(cls);
    setFormData({
      name: cls.name || "",
      default_capacity: cls.default_capacity?.toString() || ""
    });
    setShowEditModal(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const response = await api.put(`/class/${editingClass._id}`, formData);
      setShowEditModal(false);
      setEditingClass(null);
      setFormData({ name: "", default_capacity: "" });
       success("Class updated successfully");
      fetchClasses();
    } catch (err) {
      console.error("Error updating class:", err);
      error(err.response?.data?.message || "Failed to update class");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (cls) => {
    try {
      const newStatus = cls.status === "active" ? "inactive" : "active";
      const response = await api.patch(`/class/${cls._id}`, { status: newStatus });
       success("Class status updated successfully");
      fetchClasses();
    } catch (err) {
      console.error("Error updating class status:", err);
      error(err.response?.data?.message || "Failed to update class status");
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

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "bg-green-600/20 text-green-400";
      case "inactive":
        return "bg-slate-600/20 text-slate-400";
      default:
        return "bg-slate-600/20 text-slate-400";
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Classes</h1>
          <p className="text-slate-400 mt-1">Manage gym classes</p>
        </div>
        <button
          onClick={() => {
            setFormData({ name: "", default_capacity: "" });
            setShowAddModal(true);
          }}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
        >
          <Plus className="w-5 h-5" />
          New Class
        </button>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-red-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="fluid-card bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/10 shadow-xl shadow-black/20">
        <div className="table-wrapper overflow-auto">
          <table className="w-full table-sticky-header table-row-animated">
            <thead className="bg-slate-700/50">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Name</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Default Capacity</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Loading classes...
                    </div>
                  </td>
                </tr>
              ) : classes.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-slate-400">
                    No classes found
                  </td>
                </tr>
              ) : (
                classes.map((cls) => (
                  <motion.tr
                    key={cls._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-slate-700/30"
                  >
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">{cls.name || "N/A"}</div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">{cls.default_capacity || "N/A"}</div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleStatus(cls)}
                        className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${
                          cls.status === "active" 
                            ? "bg-green-600/20 text-green-400" 
                            : "bg-slate-600/20 text-slate-400"
                        }`}
                      >
                        {cls.status === "active" ? (
                          <><ToggleRight className="w-4 h-4" /> Active</>
                        ) : (
                          <><ToggleLeft className="w-4 h-4" /> Inactive</>
                        )}
                      </button>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleEdit(cls)}
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
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} classes
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

      {/* Add Class Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-lg">
            <div className="p-6 border-b border-slate-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Create Class</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                  placeholder="e.g., Zumba"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Default Capacity</label>
                <input
                  type="number"
                  value={formData.default_capacity}
                  onChange={(e) => setFormData({...formData, default_capacity: e.target.value})}
                  required
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                  placeholder="e.g., 20"
                />
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
                  {saving ? "Creating..." : "Create Class"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Class Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-lg">
            <div className="p-6 border-b border-slate-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Edit Class</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Default Capacity</label>
                <input
                  type="number"
                  value={formData.default_capacity}
                  onChange={(e) => setFormData({...formData, default_capacity: e.target.value})}
                  required
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                />
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
                  {saving ? "Updating..." : "Update Class"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
