import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  UserCog, 
  Search, 
  RefreshCw,
  Edit, 
  Plus,
  ToggleLeft,
  ToggleRight,
  Users,
  Eye,
  X,
  Archive,
  Upload,
  XCircle
} from "lucide-react";
import api from "../../api/axios.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useNotification } from "../../context/NotificationContext.jsx";

export default function Trainers() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { success, error } = useNotification();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/admin/login");
    }
  }, [isAuthenticated, navigate]);

  const [trainers, setTrainers] = useState([]);
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
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [saving, setSaving] = useState(false);
  const [editingTrainer, setEditingTrainer] = useState(null);
  const [certificationFile, setCertificationFile] = useState(null);
  const [certificationPreview, setCertificationPreview] = useState(null);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    role: "trainer",
    status: "active",
    specialization: [],
    certification: "",
    rate: "",
    max_hours: "",
    availability: {
      days: [],
      time_from: "8:00AM",
      time_to: "8:00PM"
    }
  });

  const specializationOptions = ["bulk", "cut", "calisthenics", "cardio", "strength", "hiit", "yoga", "flexibility"];
  const dayOptions = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];



  const handleSpecializationChange = (value) => {
    const updated = formData.specialization.includes(value)
      ? formData.specialization.filter(s => s !== value)
      : [...formData.specialization, value];
    setFormData({ ...formData, specialization: updated });
  };

  const handleDayToggle = (day) => {
    const updated = formData.availability.days.includes(day)
      ? formData.availability.days.filter(d => d !== day)
      : [...formData.availability.days, day];
    setFormData({
      ...formData,
      availability: { ...formData.availability, days: updated }
    });
  };

  const handleCertificationFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        error("Please select an image file");
        return;
      }
      setCertificationFile(file);
      setCertificationPreview(URL.createObjectURL(file));
    }
  };

  const removeCertificationFile = () => {
    setCertificationFile(null);
    setCertificationPreview(null);
  };

  const fetchTrainers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append("page", pagination.page);
      params.append("limit", pagination.limit);
      if (search) params.append("search", search);

      const response = await api.get(`/admin/trainers?${params.toString()}`);
      console.log("Trainers response:", response.data);
      
      // Check if response.data is the direct array or wrapped
      let trainersData = [];
      if (Array.isArray(response.data)) {
        trainersData = response.data;
      } else if (Array.isArray(response.data?.result)) {
        trainersData = response.data.result;
      } else if (Array.isArray(response.data?.data)) {
        trainersData = response.data.data;
      }
      
      console.log("Trainers array:", trainersData);
      setTrainers(trainersData);
      setPagination(prev => ({
        ...prev,
        total: response.data.total || 0,
        totalPages: response.data.totalPages || response.data.pages || 0
      }));
    } catch (err) {
      console.error("Error fetching trainers:", err);
      const errorMsg = err.response?.data?.message || err.message || "Failed to load trainers";
      error(errorMsg);
      setTrainers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrainers();
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
      
      const form = new FormData();
      form.append("first_name", formData.first_name);
      form.append("last_name", formData.last_name);
      form.append("email", formData.email);
      form.append("phone", formData.phone);
      form.append("role", formData.role || "trainer");
      form.append("status", formData.status || "active");
      form.append("specialization", JSON.stringify(formData.specialization || []));
      form.append("certification", formData.certification || "");
      form.append("rate", formData.rate || "");
      form.append("max_hours", formData.max_hours || "");
      form.append("availability", JSON.stringify(formData.availability || { days: [], time_from: "8:00AM", time_to: "8:00PM" }));
      
      if (certificationFile) {
        form.append("certification_file", certificationFile);
      }

      console.log("FormData entries:");
      for (let [key, value] of form.entries()) {
        console.log(`${key}:`, value);
      }
      console.log(formData)
      const response = await api.post("/trainers", formData);
      setShowAddModal(false);
      setCertificationFile(null);
      setCertificationPreview(null);
      setFormData({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        role: "trainer",
        status: "active",
        specialization: [],
        certification: "",
        rate: "",
        max_hours: "",
        availability: {
          days: [],
          time_from: "8:00AM",
          time_to: "8:00PM"
        }
      });
      
      success("Trainer created successfully");
      fetchTrainers();
    } catch (err) {
      console.error("Error creating trainer:", err);
      const errorMessage = err.response?.data?.message || err.response?.data?.error || "Failed to create trainer";
      error(String(errorMessage));
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (trainer) => {
    setEditingTrainer(trainer);
    setFormData({
      first_name: trainer.first_name || "",
      last_name: trainer.last_name || "",
      email: trainer.email || "",
      phone: trainer.phone || "",
      role: trainer.role || "trainer",
      status: trainer.status || "active",
      specialization: trainer.specialization || [],
      certification: trainer.certification || "",
      rate: trainer.rate || "",
      max_hours: trainer.max_hours || "",
      availability: trainer.availability || {
        days: [],
        time_from: "8:00AM",
        time_to: "8:00PM"
      }
    });
    setCertificationFile(null);
    setCertificationPreview(null);
    setShowEditModal(true);
  };

  const handleViewDetails = (trainer) => {
    setSelectedTrainer(trainer);
    setShowDetailModal(true);
  };

  const handleArchive = async (trainer) => {
    try {
      const response = await api.patch(`/trainers/${trainer._id}`, { status: "archived" });
      success("Trainer archived successfully");
      fetchTrainers();
    } catch (err) {
      console.error("Error archiving trainer:", err);
      error(err.response?.data?.message || "Failed to archive trainer");
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    console.log(formData)
    try {
      setSaving(true);
      
      const form = new FormData();
      form.append("first_name", formData.first_name);
      form.append("last_name", formData.last_name);
      form.append("email", formData.email);
      form.append("phone", formData.phone);
      form.append("role", formData.role || "trainer");
      form.append("status", formData.status || "active");
      form.append("specialization", JSON.stringify(formData.specialization || []));
      form.append("certification", formData.certification || "");
      form.append("rate", formData.rate || "");
      form.append("max_hours", formData.max_hours || "");
      form.append("availability", JSON.stringify(formData.availability));
      
      if (certificationFile) {
        form.append("certification_file", certificationFile);
      }

      console.log("FormData entries:");
      for (let [key, value] of form.entries()) {
        console.log(`${key}:`, value);
      }

      const response = await api.patch(`/trainers/${editingTrainer._id}`, form);
      setShowEditModal(false);
      setEditingTrainer(null);
      setCertificationFile(null);
      setCertificationPreview(null);
      setFormData({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        role: "trainer",
        status: "active",
        specialization: [],
        certification: "",
        rate: "",
        max_hours: "",
        availability: {
          days: [],
          time_from: "8:00AM",
          time_to: "8:00PM"
        }
      });
      success("Trainer updated successfully");
      fetchTrainers();
    } catch (err) {
      console.error("Error updating trainer:", err);
      error(err.response?.data?.message || "Failed to update trainer");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (trainer) => {
    try {
      const newStatus = trainer.status === "active" ? "inactive" : "active";
      const response = await api.patch(`/trainers/${trainer._id}`, { status: newStatus });
      success("Trainer status updated successfully");
      fetchTrainers();
    } catch (err) {
      console.error("Error updating trainer status:", err);
      error(err.response?.data?.message || "Failed to update trainer status");
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
    <div className="p-4 sm:p-6 w-full max-w-[100vw] overflow-hidden space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Trainers</h1>
          <p className="text-slate-400 mt-1">Manage trainers</p>
        </div>
        <button
          onClick={() => {
            setFormData({
              first_name: "",
              last_name: "",
              email: "",
              phone: "",
              role: "trainer",
              status: "active",
              specialization: [],
              certification: "",
              rate: "",
              availability: {
                days: [],
                time_from: "8:00AM",
                time_to: "8:00PM"
              }
            });
            setCertificationFile(null);
            setCertificationPreview(null);
            setShowAddModal(true);
          }}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
        >
          <Plus className="w-5 h-5" />
          New Trainer
        </button>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 sm:w-5 h-4 sm:h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            className="w-full pl-9 sm:pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-red-500 text-sm sm:text-base"
          />
        </div>
      </div>

      {/* Table */}
      <div className="fluid-card bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/10 shadow-xl shadow-black/20 w-full">
        <div className="table-wrapper overflow-auto">
          <table className="w-full min-w-[800px] lg:min-w-full divide-y divide-slate-700 table-sticky-header table-row-animated">
            <thead className="bg-slate-700/50">
              <tr>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider whitespace-nowrap">Trainer</th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider whitespace-nowrap hidden md:table-cell">Email</th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider whitespace-nowrap hidden lg:table-cell">Specialization</th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider whitespace-nowrap hidden 2xl:table-cell">Availability</th>
                
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider whitespace-nowrap">Status</th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-3 sm:px-4 py-8 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Loading trainers...
                    </div>
                  </td>
                </tr>
              ) : trainers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-3 sm:px-4 py-8 text-center text-slate-400">
                    No trainers found
                  </td>
                </tr>
              ) : (
                trainers.map((trainer) => (
                  <motion.tr
                    key={trainer._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-slate-700/30"
                  >
                    <td className="px-3 sm:px-4 py-3 sm:py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-600 flex items-center justify-center text-white font-medium text-xs sm:text-sm">
                          {trainer.first_name?.charAt(0)}{trainer.last_name?.charAt(0)}
                        </div>
                        <div className="ml-3 sm:ml-4">
                          <div className="text-sm font-medium text-white">
                            {trainer.first_name} {trainer.last_name}
                          </div>
                          <div className="text-xs text-slate-400 md:hidden">{trainer.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-3 sm:py-4 whitespace-nowrap hidden md:table-cell">
                      <div className="text-sm text-white">{trainer.email || "N/A"}</div>
                    </td>
                    <td className="px-3 sm:px-4 py-3 sm:py-4 whitespace-nowrap hidden lg:table-cell">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {trainer.specialization && Array.isArray(trainer.specialization) && trainer.specialization.length > 0 ? (
                          trainer.specialization.map((spec, index) => (
                            <span key={index} className="px-2 py-0.5 sm:py-1 text-xs font-medium bg-blue-600/20 text-blue-400 rounded-full">
                              {spec.charAt(0).toUpperCase() + spec.slice(1)}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm text-slate-400">N/A</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-3 sm:py-4 whitespace-nowrap hidden 2xl:table-cell">
                      <div className="text-sm text-white">
                        {trainer.availability?.days && Array.isArray(trainer.availability.days) && trainer.availability.days.length > 0 ? (
                          <div className="flex flex-col gap-1">
                            <div className="flex flex-wrap gap-1">
                              {trainer.availability.days.map((day, index) => (
                                <span key={index} className="px-2 py-0.5 text-xs font-medium bg-purple-600/20 text-purple-400 rounded">
                                  {day.charAt(0).toUpperCase() + day.slice(1)}
                                </span>
                              ))}
                            </div>
                            <span className="text-xs text-slate-400">
                              {trainer.availability.time_from || '--'} - {trainer.availability.time_to || '--'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400">N/A</span>
                        )}
                      </div>
                    </td>
                    
                    <td className="px-3 sm:px-4 py-3 sm:py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleStatus(trainer)}
                        className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${
                          trainer.status === "active" 
                            ? "bg-green-600/20 text-green-400" 
                            : "bg-slate-600/20 text-slate-400"
                        }`}
                      >
                        {trainer.status === "active" ? (
                          <><ToggleRight className="w-3 h-3 sm:w-4 sm:h-4" /> <span className="hidden sm:inline">Active</span></>
                        ) : (
                          <><ToggleLeft className="w-3 h-3 sm:w-4 sm:h-4" /> <span className="hidden sm:inline">Inactive</span></>
                        )}
                      </button>
                    </td>
                    <td className="px-3 sm:px-4 py-3 sm:py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleViewDetails(trainer)}
                          className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(trainer)}
                          className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {trainer.status !== "archived" && (
                          <button
                            onClick={() => handleArchive(trainer)}
                            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition"
                            title="Archive"
                          >
                            <Archive className="w-4 h-4" />
                          </button>
                        )}
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
          <div className="px-3 sm:px-4 py-4 border-t border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs sm:text-sm text-slate-400 text-center sm:text-left">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} trainers
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

      {/* Add Trainer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-md sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6 border-b border-slate-700 flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-bold text-white">Create Trainer</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">First Name</label>
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                    required
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                    required
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Phone</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  Password
                  <span className="text-xs text-slate-500 ml-2">(Auto-generated if empty)</span>
                </label>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Specialization</label>
                <div className="flex flex-wrap gap-2">
                  {specializationOptions.map((spec) => (
                    <button
                      key={spec}
                      type="button"
                      onClick={() => handleSpecializationChange(spec)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition ${
                        formData.specialization.includes(spec)
                          ? "bg-red-600 text-white"
                          : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                      }`}
                    >
                      {spec.charAt(0).toUpperCase() + spec.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Certification Photo</label>
                {certificationPreview || formData.certification ? (
                  <div className="relative inline-block">
                    <img 
                      src={certificationPreview || formData.certification} 
                      alt="Certification" 
                      className="w-32 h-32 object-cover rounded-lg border border-slate-600"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        removeCertificationFile();
                        setFormData({...formData, certification: ""});
                      }}
                      className="absolute -top-2 -right-2 p-1 bg-red-600 rounded-full text-white hover:bg-red-700"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full max-w-xs px-4 py-6 bg-slate-700 border-2 border-dashed border-slate-600 rounded-lg cursor-pointer hover:border-red-500 hover:bg-slate-600 transition">
                    <Upload className="w-8 h-8 text-slate-400 mb-2" />
                    <span className="text-sm text-slate-400">Click to upload certification</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCertificationFileChange}
                      className="hidden"
                    />
                  </label>
                )}
                <input
                  type="hidden"
                  value={formData.certification || ""}
                  onChange={(e) => setFormData({...formData, certification: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Hourly Rate (PHP)</label>
                <input
                  type="number"
                  value={formData.rate || ""}
                  onChange={(e) => setFormData({...formData, rate: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                  placeholder="e.g., 300"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Max Hours per session</label>
                <input
                  type="number"
                  value={formData.max_hours || ""}
                  onChange={(e) => setFormData({...formData, max_hours: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                  placeholder="e.g., 4"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Availability - Days</label>
                <div className="flex flex-wrap gap-2">
                  {dayOptions.map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleDayToggle(day)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition ${
                        formData.availability?.days?.includes(day)
                          ? "bg-purple-600 text-white"
                          : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                      }`}
                    >
                      {day.charAt(0).toUpperCase() + day.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Time From</label>
                  <select
                    value={formData.availability?.time_from || "8:00AM"}
                    onChange={(e) => setFormData({
                      ...formData,
                      availability: { ...formData.availability, time_from: e.target.value }
                    })}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                  >
                    {["6:00AM", "7:00AM", "8:00AM", "9:00AM", "10:00AM", "11:00AM", "12:00PM", "1:00PM", "2:00PM"].map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Time To</label>
                  <select
                    value={formData.availability?.time_to || "8:00PM"}
                    onChange={(e) => setFormData({
                      ...formData,
                      availability: { ...formData.availability, time_to: e.target.value }
                    })}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                  >
                    {["12:00PM", "1:00PM", "2:00PM", "3:00PM", "4:00PM", "5:00PM", "6:00PM", "7:00PM", "8:00PM", "9:00PM"].map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
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
                  {saving ? "Creating..." : "Create Trainer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Trainer Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-md sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6 border-b border-slate-700 flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-bold text-white">Edit Trainer</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">First Name</label>
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                    required
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                    required
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Phone</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Status</label>
                <select
                  value={formData.status || "active"}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Specialization</label>
                <div className="flex flex-wrap gap-2">
                  {specializationOptions.map((spec) => (
                    <button
                      key={spec}
                      type="button"
                      onClick={() => handleSpecializationChange(spec)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition ${
                        formData.specialization?.includes(spec)
                          ? "bg-red-600 text-white"
                          : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                      }`}
                    >
                      {spec.charAt(0).toUpperCase() + spec.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Certification Photo</label>
                {certificationPreview || formData.certification ? (
                  <div className="relative inline-block">
                    <img 
                      src={certificationPreview || formData.certification} 
                      alt="Certification" 
                      className="w-32 h-32 object-cover rounded-lg border border-slate-600"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        removeCertificationFile();
                        setFormData({...formData, certification: ""});
                      }}
                      className="absolute -top-2 -right-2 p-1 bg-red-600 rounded-full text-white hover:bg-red-700"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full max-w-xs px-4 py-6 bg-slate-700 border-2 border-dashed border-slate-600 rounded-lg cursor-pointer hover:border-red-500 hover:bg-slate-600 transition">
                    <Upload className="w-8 h-8 text-slate-400 mb-2" />
                    <span className="text-sm text-slate-400">Click to upload certification</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCertificationFileChange}
                      className="hidden"
                    />
                  </label>
                )}
                <input
                  type="hidden"
                  value={formData.certification || ""}
                  onChange={(e) => setFormData({...formData, certification: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Hourly Rate (PHP)</label>
                <input
                  type="number"
                  value={formData.rate || ""}
                  onChange={(e) => setFormData({...formData, rate: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                  placeholder="e.g., 300"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Max Hours per session</label>
                <input
                  type="number"
                  value={formData.max_hours || ""}
                  onChange={(e) => setFormData({...formData, max_hours: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                  placeholder="e.g., 20"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Availability - Days</label>
                <div className="flex flex-wrap gap-2">
                  {dayOptions.map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleDayToggle(day)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition ${
                        formData.availability?.days?.includes(day)
                          ? "bg-purple-600 text-white"
                          : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                      }`}
                    >
                      {day.charAt(0).toUpperCase() + day.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Time From</label>
                  <select
                    value={formData.availability?.time_from || "8:00AM"}
                    onChange={(e) => setFormData({
                      ...formData,
                      availability: { ...formData.availability, time_from: e.target.value }
                    })}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                  >
                    {["6:00AM", "7:00AM", "8:00AM", "9:00AM", "10:00AM", "11:00AM", "12:00PM", "1:00PM", "2:00PM"].map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Time To</label>
                  <select
                    value={formData.availability?.time_to || "8:00PM"}
                    onChange={(e) => setFormData({
                      ...formData,
                      availability: { ...formData.availability, time_to: e.target.value }
                    })}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                  >
                    {["12:00PM", "1:00PM", "2:00PM", "3:00PM", "4:00PM", "5:00PM", "6:00PM", "7:00PM", "8:00PM", "9:00PM"].map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
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
                  {saving ? "Updating..." : "Update Trainer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {showDetailModal && selectedTrainer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl w-full max-w-lg sm:max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-700">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg sm:text-xl font-bold text-white">Trainer Details</h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Trainer Info */}
              <div className="space-y-4">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-full bg-slate-600 flex items-center justify-center text-white text-xl font-medium">
                    {console.log(selectedTrainer)}
                    {selectedTrainer.first_name?.charAt(0)}{selectedTrainer.last_name?.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{selectedTrainer.first_name} {selectedTrainer.last_name}</h3>
                    <p className="text-sm text-slate-400">{selectedTrainer.email}</p>
                    <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full ${
                      selectedTrainer.status === "active" ? "bg-green-600/20 text-green-400" : "bg-slate-600/20 text-slate-400"
                    }`}>
                      {selectedTrainer.status?.charAt(0).toUpperCase() + selectedTrainer.status?.slice(1)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-400">Phone</p>
                    <p className="text-sm text-white">{selectedTrainer.phone || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Specialization</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedTrainer.specialization && Array.isArray(selectedTrainer.specialization) && selectedTrainer.specialization.length > 0 ? (
                        selectedTrainer.specialization.map((spec, index) => (
                          <span key={index} className="px-2 py-1 text-xs font-medium bg-blue-600/20 text-blue-400 rounded-full">
                            {spec.charAt(0).toUpperCase() + spec.slice(1)}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-slate-400">N/A</span>
                      )}
                    </div>
                  </div>
                </div>

                {selectedTrainer.certification && (
                  <div>
                    <p className="text-xs text-slate-400">Certification</p>
                    <img 
                      src={selectedTrainer.certification} 
                      alt="Certification" 
                      className="mt-1 max-w-[200px] rounded-lg border border-slate-600"
                    />
                  </div>
                )}

                <div>
                  <p className="text-xs text-slate-400">Availability</p>
                  {selectedTrainer.availability?.days && Array.isArray(selectedTrainer.availability.days) && selectedTrainer.availability.days.length > 0 ? (
                    <div className="mt-1">
                      <div className="flex flex-wrap gap-1">
                        {selectedTrainer.availability.days.map((day, index) => (
                          <span key={index} className="px-2 py-1 text-xs font-medium bg-purple-600/20 text-purple-400 rounded">
                            {day.charAt(0).toUpperCase() + day.slice(1)}
                          </span>
                        ))}
                      </div>
                      <p className="text-sm text-white mt-1">
                        {selectedTrainer.availability.time_from || '--'} - {selectedTrainer.availability.time_to || '--'}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400">N/A</p>
                  )}
                </div>

                {/* Assigned clients */}
                <div>
                  <p className="text-xs text-slate-400 mb-2">Assigned clients ({selectedTrainer.clients?.length || 0})</p>
                  {selectedTrainer.clients && Array.isArray(selectedTrainer.clients) && selectedTrainer.clients.length > 0 ? (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {selectedTrainer.clients.map((client, index) => (
                        <div key={index} className="flex items-center gap-3 p-2 bg-slate-700/50 rounded-lg">
                          <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-white text-xs font-medium">
                            {client.first_name?.charAt(0)}{client.last_name?.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm text-white">{client.first_name} {client.last_name}</p>
                            <p className="text-xs text-slate-400">{client.email}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400">No assigned clients</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
