import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { QRCodeCanvas } from "qrcode.react";
import { 
  Users, 
  Search, 
  Plus, 
  MoreVertical,
  Mail,
  Phone,
  Calendar,
  CreditCard,
  Filter,
  RefreshCw,
  Edit,
  Eye,
  Trash2,
  UserCheck,
  UserX,
  Archive,
  Download
} from "lucide-react";
import api from "../../api/axios.js";
import { useAuth } from "../../context/AuthContext.jsx";

export default function Members() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/admin/login");
    }
  }, [isAuthenticated, navigate]);

  const [members, setMembers] = useState([]);
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
  const [selectedMember, setSelectedMember] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [memberQrCode, setMemberQrCode] = useState(null);
  const [editForm, setEditForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    gender: "",
    date_of_birth: "",
    address: "",
    medical_condition: "",
    training_type: "",
    experience_level: "",
    days_per_week: "",
    session_minutes: "",
    emergency_name: "",
    emergency_contact: "",
    emergency_relationship: ""
  });
  const [addForm, setAddForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    gender: "",
    date_of_birth: "",
    password: ""
  });
  
  const [saving, setSaving] = useState(false);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append("page", pagination.page);
      params.append("limit", pagination.limit);
      if (search) params.append("search", search);
      if (statusFilter) params.append("status", statusFilter);

      const response = await api.get(`/admin/members?${params.toString()}`);

      setMembers(response.data.members || []);
      setPagination(prev => ({
        ...prev,
        total: response.data.total || 0,
        totalPages: response.data.totalPages || 0
      }));
    } catch (err) {
      console.error("Error fetching members:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [pagination.page, pagination.limit, statusFilter]);

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (pagination.page === 1) {
        fetchMembers();
      } else {
        setPagination(prev => ({ ...prev, page: 1 }));
      }
    }, 500);
    return () => clearTimeout(delaySearch);
  }, [search]);

  const handleSearch = (e) => {
    setSearch(e.target.value);
  };

  const handleStatusFilter = (e) => {
    setStatusFilter(e.target.value);
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const getStatusBadge = (status) => {
    const styles = {
      active: "bg-green-600/20 text-green-500",
      inactive: "bg-gray-600/20 text-gray-400",
      archived: "bg-red-600/20 text-red-500",
      pending: "bg-yellow-600/20 text-yellow-500"
    };
    return styles[status] || styles.inactive;
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };


  const handleAddMember = (member) => {
    setAddForm({
      first_name: member.first_name || "",
      last_name: member.last_name || "",
      email: member.email || "",
      phone: member.phone || "",
      gender: member.gender || "",
      date_of_birth: member.date_of_birth ? member.date_of_birth.split('T')[0] : "",
      password: member.password || ""
    });
    setShowAddModal(true);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      
      // Normalize the form data
      const normalizedForm = {
        first_name: addForm.first_name.trim(),
        last_name: addForm.last_name.trim(),
        email: addForm.email.trim().toLowerCase(),
        phone: addForm.phone.trim(),
        gender: addForm.gender?.trim() || null,
        date_of_birth: addForm.date_of_birth || null,
        password: addForm.password
      };
      console.log("Submitting new member:", normalizedForm);
      
      await api.post("/admin/members", normalizedForm);
      setShowAddModal(false);
      fetchMembers();
      // Reset form
      setAddForm({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        gender: "",
        date_of_birth: "",
        password: ""
      });
    } catch (err) {
      console.error("Error adding member:", err);
      alert("Failed to add member");
    } finally {
      setSaving(false);
    }
  };

  // Handle Edit
  const handleEditClick = (member) => {
    setSelectedMember(member);
    setEditForm({
      first_name: member.first_name || "",
      last_name: member.last_name || "",
      email: member.email || "",
      phone: member.phone || "",
      gender: member.gender || "",
      date_of_birth: member.date_of_birth ? member.date_of_birth.split('T')[0] : "",
      address: member.address || "",
      medical_condition: member.medical_condition || "",
      training_type: member.training_type || "",
      experience_level: member.experience_level || "",
      days_per_week: member.days_per_week || "",
      session_minutes: member.session_minutes || "",
      emergency_name: member.emergency_name || "",
      emergency_contact: member.emergency_contact || "",
      emergency_relationship: member.emergency_relationship || ""
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      
      // Normalize the form data
      const normalizedForm = {
        first_name: editForm.first_name.trim(),
        last_name: editForm.last_name.trim(),
        email: editForm.email.trim().toLowerCase(),
        phone: editForm.phone.trim(),
        address: editForm.address?.trim() || null,
        gender: editForm.gender?.trim() || null,
        date_of_birth: editForm.date_of_birth || null,
        fitness_goal: [],
        medical_condition: editForm.medical_condition?.trim() || null,
        training_type: editForm.training_type?.trim() || null,
        experience_level: editForm.experience_level?.trim() || null,
        days_per_week: editForm.days_per_week?.trim() || null,
        session_minutes: editForm.session_minutes?.trim() || null,
        emergency_name: editForm.emergency_name?.trim() || null,
        emergency_contact: editForm.emergency_contact?.trim() || null,
        emergency_relationship: editForm.emergency_relationship?.trim() || null
      };
      
      await api.patch(`/admin/members/${selectedMember._id}`, normalizedForm);
      setShowEditModal(false);
      fetchMembers();
    } catch (err) {
      console.error("Error updating member:", err);
      alert("Failed to update member");
    } finally {
      setSaving(false);
    }
  };

  // Handle Delete (Status Change)
  const handleStatusChange = async (member, newStatus) => {
    try {
      await api.patch(`/admin/members/${member._id}/status`, { status: newStatus });
      fetchMembers();
    } catch (err) {
      console.error("Error changing status:", err);
      alert("Failed to update member status");
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Members Management</h1>
          <p className="text-slate-400 text-sm">Manage gym members and their memberships</p>
        </div>
        <div className="flex gap-2 sm:gap-3">
          <button 
            onClick={fetchMembers}
            disabled={loading}
            className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition flex items-center justify-center gap-2 disabled:opacity-50 text-sm sm:text-base"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Member</span>
            <span className="sm:hidden">+</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={handleSearch}
              className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-red-500"
            />
          </div>
          
          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={handleStatusFilter}
              className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="archived">Archived</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-slate-800 rounded-xl sm:rounded-2xl border border-slate-700 overflow-hidden flex flex-col h-[calc(100vh-220px)]">
        <div className="overflow-auto flex-1 min-h-0 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800">
          <table className="w-full">
            <thead className="bg-slate-700/50 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Member</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider hidden md:table-cell">Contact</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider hidden lg:table-cell">Plan</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider hidden sm:table-cell">Joined</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Loading members...
                    </div>
                  </td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-400">
                    No members found
                  </td>
                </tr>
              ) : (
                members.map((member) => (
                  <motion.tr
                    key={member._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-slate-700/30"
                  >
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-600 flex items-center justify-center text-white font-medium text-sm">
                          {member.first_name?.charAt(0)}{member.last_name?.charAt(0)}
                        </div>
                        <div className="ml-2 sm:ml-4">
                          <div className="text-sm font-medium text-white">
                            {member.first_name} {member.last_name}
                          </div>
                          <div className="text-xs sm:text-sm text-slate-400 md:hidden">{member.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden md:table-cell">
                      <div className="text-sm text-slate-300">{member.email}</div>
                      <div className="text-sm text-slate-400">{member.phone || "No phone"}</div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                      <div className="text-sm text-white">
                        {member.plan?.label || "No Plan"}
                      </div>
                      <div className="text-sm text-slate-400">
                        {member.plan?.duration ? `${member.plan.duration} days` : ""}
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(member.status)}`}>
                        {member.status || "inactive"}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-slate-400 hidden sm:table-cell">
                      {formatDate(member.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedMember(member);
                            setMemberQrCode(member.qr_code || null);
                            setShowDetailModal(true);
                          }}
                          className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditClick(member)}
                          className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <div className="relative group">
                          <button
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-slate-700 rounded-lg transition"
                            title="Change Status"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          {/* Dropdown for status change */}
                          <div className="absolute right-0 mt-1 w-40 bg-slate-700 border border-slate-600 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                            <button
                              onClick={() => handleStatusChange(member, "active")}
                              className="w-full px-3 py-2 text-left text-sm text-green-500 hover:bg-slate-600 rounded-t-lg flex items-center gap-2"
                            >
                              <UserCheck className="w-4 h-4" /> Activate
                            </button>
                            <button
                              onClick={() => handleStatusChange(member, "inactive")}
                              className="w-full px-3 py-2 text-left text-sm text-gray-400 hover:bg-slate-600 flex items-center gap-2"
                            >
                              <UserX className="w-4 h-4" /> Deactivate
                            </button>
                            <button
                              onClick={() => handleStatusChange(member, "archived")}
                              className="w-full px-3 py-2 text-left text-sm text-red-500 hover:bg-slate-600 rounded-b-lg flex items-center gap-2"
                            >
                              <Archive className="w-4 h-4" /> Archive
                            </button>
                          </div>
                        </div>
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
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} members
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-2 sm:px-3 py-1 bg-slate-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-600 transition text-xs sm:text-sm"
              >
                <span className="hidden sm:inline">Previous</span>
                <span className="sm:hidden">&lt;</span>
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
                <span className="sm:hidden">&gt;</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Member Detail Modal */}
      {showDetailModal && selectedMember && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-slate-800 rounded-xl sm:rounded-2xl border border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6 border-b border-slate-700 flex items-center justify-between sticky top-0 bg-slate-800">
              <h2 className="text-lg sm:text-xl font-bold text-white">Member Details</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Member Info with QR Code */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-slate-600 flex items-center justify-center text-white text-xl font-medium">
                    {selectedMember.first_name?.charAt(0)}{selectedMember.last_name?.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      {selectedMember.first_name} {selectedMember.last_name}
                    </h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(selectedMember.status)}`}>
                      {selectedMember.status || "inactive"}
                    </span>
                  </div>
                </div>
                {memberQrCode && (
                  <div className="bg-white p-2 rounded-lg">
                      <QRCodeCanvas
    value={memberQrCode}
    size={80}
  />
                  </div>
                )}
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-700/30 rounded-xl p-4">
                  <label className="text-xs text-slate-400 uppercase">Email</label>
                  <p className="text-white">{selectedMember.email || "N/A"}</p>
                </div>
                <div className="bg-slate-700/30 rounded-xl p-4">
                  <label className="text-xs text-slate-400 uppercase">Contact Number</label>
                  <p className="text-white">{selectedMember.phone || "N/A"}</p>
                </div>
                <div className="bg-slate-700/30 rounded-xl p-4">
                  <label className="text-xs text-slate-400 uppercase">Gender</label>
                  <p className="text-white capitalize">{selectedMember.gender || "N/A"}</p>
                </div>
                <div className="bg-slate-700/30 rounded-xl p-4">
                  <label className="text-xs text-slate-400 uppercase">Date of Birth</label>
                  <p className="text-white">{formatDate(selectedMember.date_of_birth)}</p>
                </div>
                <div className="bg-slate-700/30 rounded-xl p-4">
                  <label className="text-xs text-slate-400 uppercase">Plan</label>
                  <p className="text-white">{selectedMember.plan?.label || "No Plan"}</p>
                </div>
                <div className="bg-slate-700/30 rounded-xl p-4">
                  <label className="text-xs text-slate-400 uppercase">Joined Date</label>
                  <p className="text-white">{formatDate(selectedMember.createdAt)}</p>
                </div>
                {selectedMember.fitness_goal && (
                  <div className="bg-slate-700/30 rounded-xl p-4 md:col-span-2">
                    <label className="text-xs text-slate-400 uppercase">Fitness Goals</label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedMember.fitness_goal.map((goal, index) => (
                        <span key={index} className="px-2 py-1 bg-slate-600 text-white text-sm rounded-lg capitalize">
                          {goal}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="p-6 border-t border-slate-700 flex justify-end gap-3">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
              >
                Close
              </button>
              <button 
                onClick={() => {
                  setShowDetailModal(false);
                  handleEditClick(selectedMember);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
              >
                Edit Member
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Member Modal */}
      {showEditModal && selectedMember && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Edit Member</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">First Name</label>
                  <input
                    type="text"
                    value={editForm.first_name}
                    onChange={(e) => setEditForm({...editForm, first_name: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={editForm.last_name}
                    onChange={(e) => setEditForm({...editForm, last_name: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Contact Number</label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={editForm.date_of_birth}
                    onChange={(e) => setEditForm({...editForm, date_of_birth: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Gender</label>
                <select
                  value={editForm.gender}
                  onChange={(e) => setEditForm({...editForm, gender: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
              
              {/* Additional Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Address</label>
                  <input
                    type="text"
                    value={editForm.address}
                    onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                    placeholder="Enter address"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Medical Condition</label>
                  <input
                    type="text"
                    value={editForm.medical_condition}
                    onChange={(e) => setEditForm({...editForm, medical_condition: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                    placeholder="Medical condition (if any)"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Training Type</label>
                  <select
                    value={editForm.training_type}
                    onChange={(e) => setEditForm({...editForm, training_type: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                  >
                    <option value="">Select training type</option>
                    <option value="one_on_one">One on One</option>
                    <option value="group">Group</option>
                    <option value="both">Both</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Experience Level</label>
                  <select
                    value={editForm.experience_level}
                    onChange={(e) => setEditForm({...editForm, experience_level: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                  >
                    <option value="">Select experience</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Days Per Week</label>
                  <input
                    type="number"
                    min="1"
                    max="7"
                    value={editForm.days_per_week}
                    onChange={(e) => setEditForm({...editForm, days_per_week: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                    placeholder="1-7"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Session Minutes</label>
                  <input
                    type="number"
                    min="15"
                    max="180"
                    step="15"
                    value={editForm.session_minutes}
                    onChange={(e) => setEditForm({...editForm, session_minutes: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                    placeholder="15, 30, 45, 60..."
                  />
                </div>
              </div>
              
              {/* Emergency Contact Section */}
              <div className="border-t border-slate-600 pt-4 mt-4">
                <h3 className="text-lg font-medium text-white mb-3">Emergency Contact</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Name</label>
                    <input
                      type="text"
                      value={editForm.emergency_name}
                      onChange={(e) => setEditForm({...editForm, emergency_name: e.target.value})}
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                      placeholder="Emergency contact name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Contact Number</label>
                    <input
                      type="tel"
                      value={editForm.emergency_contact}
                      onChange={(e) => setEditForm({...editForm, emergency_contact: e.target.value})}
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                      placeholder="Emergency phone"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Relationship</label>
                    <input
                      type="text"
                      value={editForm.emergency_relationship}
                      onChange={(e) => setEditForm({...editForm, emergency_relationship: e.target.value})}
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                      placeholder="e.g., Spouse, Parent"
                    />
                  </div>
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
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Add New Member</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">First Name</label>
                  <input
                    type="text"
                    value={addForm.first_name}
                    onChange={(e) => setAddForm({...addForm, first_name: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                    placeholder="Enter first name"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={addForm.last_name}
                    onChange={(e) => setAddForm({...addForm, last_name: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                    placeholder="Enter last name"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Email</label>
                <input
                  type="email"
                  value={addForm.email}
                  onChange={(e) => setAddForm({...addForm, email: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                  placeholder="Enter email"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Contact Number</label>
                  <input
                    type="tel"
                    value={addForm.phone}
                    onChange={(e) => setAddForm({...addForm, phone: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                    placeholder="Enter contact number"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={addForm.date_of_birth}
                    onChange={(e) => setAddForm({...addForm, date_of_birth: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Gender</label>
                  <select
                    value={addForm.gender}
                    onChange={(e) => setAddForm({...addForm, gender: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Initial Password</label>
                  <input
                    type="password"
                    value={addForm.password}
                    onChange={(e) => setAddForm({...addForm, password: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                    placeholder="Enter initial password"
                  />
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
                  {saving ? "Adding..." : "Add Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
