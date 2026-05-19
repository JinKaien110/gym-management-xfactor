import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  FileText, 
  Search, 
  Plus, 
  Filter,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  User,
  CreditCard,
  Package,
  File,
  Eye
} from "lucide-react";
import api from "../../api/axios.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useNotification } from "../../context/NotificationContext.jsx";
import ucfirst from "../../utils/ucfirst";
const BASE_URL = import.meta.env.VITE_API;


export default function membershipRequests() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { success, error } = useNotification();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/admin/login");
    }
  }, [isAuthenticated, navigate]);

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showMedicalProof, setShowMedicalProof] = useState(false);
  const [selectedMedicalProof, setSelectedMedicalProof] = useState(null);
  const [selectedMedicalProofType, setSelectedMedicalProofType] = useState("");
  const [processingAction, setProcessingAction] = useState(false);
  const [clients, setclients] = useState([]);

  useEffect(() => {
    return () => {
      if (selectedMedicalProof) {
        URL.revokeObjectURL(selectedMedicalProof);
      }
    };
  }, [selectedMedicalProof]);
  const [plans, setPlans] = useState([]);
  const [pricing, setPricing] = useState([]);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    start_date: "",
    end_date: "",
    frozen_from: "",
    frozen_till: "",
    is_frozen: false,
  });

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append("page", pagination.page);
      params.append("limit", pagination.limit);
      if (search) params.append("search", search);
      if (statusFilter) params.append("status", statusFilter);
      if (typeFilter) params.append("request_type", typeFilter);

      const response = await api.get(`/admin/memberships-request?${params.toString()}`);
      console.log(response)
      setRequests(response.data.data || []);
      setPagination(prev => ({
        ...prev,
        total: response.data.total || 0,
        totalPages: response.data.totalPages || 0
      }));
    } catch (err) {
      console.error("Error fetching membership requests:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchclients = async () => {
    try {
      const response = await api.get("/admin/clients?limit=100");
      setclients(response.data.clients || []);
    } catch (err) {
      console.error("Error fetching clients:", err);
    }
  };



  const fetchPricing = async () => {
    try {
      const response = await api.get("/pricing");
      console.log("Pricing response:", response.data);
      setPricing(response.data?.data || response.data?.result || []);
    } catch (err) {
      console.error("Error fetching pricing:", err);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [pagination.page, search, statusFilter, typeFilter]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const response = await api.post("/admin/membership-request", formData);
      setShowAddModal(false);
      setFormData({
        client_id: "",
        pricing_id: "",
        client_type: "regular",
        status: "draft"
      });
      success(response.data?.result || "membership request created successfully");
      fetchRequests();
    } catch (err) {
      console.error("Error creating membership request:", err);
      error(err.response?.data?.message || "Failed to create membership request");
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "bg-green-600/20 text-green-400";
      case "draft":
        return "bg-slate-600/20 text-slate-400";
      case "pending_discount_review":
        case "pending":
        return "bg-orange-600/20 text-orange-400";
      case "ready_for_payment":
        return "bg-blue-600/20 text-blue-400";
      case "approved":
        return "bg-green-600/20 text-green-400";
      case "rejected":
        return "bg-red-600/20 text-red-400";
      default:
        return "bg-slate-600/20 text-slate-400";
    }
  };

  const getTypeBadge = (type) => {
    switch (type?.toLowerCase()) {
      case "creation":
        return "bg-green-600/20 text-green-400";
      case "cancellation":
        return "bg-red-600/20 text-red-400";
      case "freeze":
        return "bg-blue-600/20 text-blue-400";
      default:
        return "bg-slate-600/20 text-slate-400";
    }
  };

  const formatStatus = (status) => {
    if (!status) return "N/A";
    // Replace underscores with spaces, then capitalize first letter of each word (title case)
    return status
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatType = (type) => {
    if (!type) return "N/A";
    // Capitalize first letter only
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  const handleViewMedicalProof = async (proofUrl) => {
    if (!proofUrl) return;
    try {
      const response = await fetch(`${BASE_URL}${proofUrl}`);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      setSelectedMedicalProof(objectUrl);
      // Determine content type for display (image vs PDF/doc)
      const isImage = blob.type.startsWith("image/");
      setSelectedMedicalProofType(isImage ? "image" : "document");
      setShowMedicalProof(true);
    } catch (err) {
      console.error("Error fetching medical proof:", err);
      error("Failed to load medical proof");
    }
  };

  const handleViewRequest = (request) => {
    setSelectedRequest(request);
    setShowViewModal(true);
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;
    try {
      setProcessingAction(true);
      const payload = {
        frozen_from: selectedRequest.freeze_start_date,
        frozen_til: selectedRequest.freeze_end_date,
        is_frozen: true,
        statusRequest: "approved"
      }
        
      console.log(payload)
      const response = await api.patch(`/membership/update-membership/${selectedRequest.membership_id}`, payload);
      success("membership request approved successfully");
      setShowViewModal(false);
      fetchRequests();
    } catch (err) {
      console.error("Error approving request:", err);
      error(err.response?.data?.message || "Failed to approve request");
    } finally {
      setProcessingAction(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;
    try {
      setProcessingAction(true);
      const payload = {
        frozen_from: selectedRequest.freeze_start_date,
        frozen_til: selectedRequest.freeze_end_date,
        is_frozen: true,
        statusRequest: "rejected"
      }
      const response = await api.patch(`/membership/update-membership/${selectedRequest.membership_id}`, payload);
      success("membership request rejected successfully");
      setShowViewModal(false);
      fetchRequests();
    } catch (err) {
      console.error("Error rejecting request:", err);
      error(err.response?.data?.message || "Failed to reject request");
    } finally {
      setProcessingAction(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Freeze Membership Requests</h1>
          <p className="text-slate-400 mt-1">Manage membership creation and cancellation requests</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by client name or email..."
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
          <option value="draft">Draft</option>
          <option value="pending_discount_review">Pending Discount Review</option>
          <option value="ready_for_payment">Ready for Payment</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setPagination(prev => ({ ...prev, page: 1 }));
          }}
          className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-red-500"
        >
          <option value="">All Request Types</option>
          <option value="creation">Creation</option>
          <option value="cancellation">Cancellation</option>
          <option value="freeze">Freeze</option>
        </select>
      </div>

      {/* Table */}
      <div className="fluid-card bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/10 shadow-xl shadow-black/20">
        <div className="table-wrapper overflow-auto">
          <table className="w-full table-sticky-header table-row-animated">
            <thead className="bg-slate-700/50">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">client</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider hidden md:table-cell">Type</th>
          
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider hidden sm:table-cell">Date</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Loading requests...
                    </div>
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-slate-400">
                    No membership requests found
                  </td>
                </tr>
              ) : (
                requests.map((request) => (
                  <motion.tr
                    key={request._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-slate-700/30"
                  >
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-600 flex items-center justify-center text-white font-medium text-sm">
                          {request.client?.first_name?.charAt(0)}{request.client?.last_name?.charAt(0)}
                        </div>
                        <div className="ml-2 sm:ml-4">
                          <div className="text-sm font-medium text-white">
                            {request.client?.first_name} {request.client?.last_name}
                          </div>
                          <div className="text-xs sm:text-sm text-slate-400 md:hidden">{request.client?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden md:table-cell">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeBadge(request.request_type)}`}>
                        {ucfirst(request.request_type)}
                      </span>
                    </td>
                    
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(request.status)}`}>
                        {formatStatus(request.status)}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-slate-400 hidden sm:table-cell">
                      {formatDate(request.createdAt)}
                    </td>
                     <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                       <div className="flex items-center gap-1">
                         <button
                           onClick={() => handleViewRequest(request)}
                           className="p-2 text-slate-400 hover:text-white hover:bg-slate-600 rounded-lg transition"
                           title="View Details"
                         >
                           <Eye className="w-4 h-4" />
                         </button>
                         {request.status === "pending" && (
                           <>
                             <button
                               onClick={() => {
                                 setSelectedRequest(request);
                                 handleApprove();
                               }}
                               className="p-2 text-green-400 hover:text-green-300 hover:bg-green-600/20 rounded-lg transition"
                               title="Approve"
                             >
                               <CheckCircle className="w-4 h-4" />
                             </button>
                             <button
                               onClick={() => {
                                 setSelectedRequest(request);
                                 handleReject();
                               }}
                               className="p-2 text-red-400 hover:text-red-300 hover:bg-red-600/20 rounded-lg transition"
                               title="Reject"
                             >
                               <XCircle className="w-4 h-4" />
                             </button>
                           </>
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
          <div className="px-3 sm:px-6 py-4 border-t border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs sm:text-sm text-slate-400 text-center sm:text-left">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} requests
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

      {/* Add Request Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Create membership Request</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">client</label>
                <select
                  value={formData.client_id}
                  onChange={(e) => setFormData({...formData, client_id: e.target.value})}
                  required
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                >
                  <option value="">Select client</option>
                  {clients.map((client) => (
                    <option key={client._id} value={client._id}>
                      {client.first_name} {client.last_name} ({client.email})
                    </option>
                  ))}
                </select>
              </div>
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
                      {plan.label} ({plan.duration} days)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Pricing</label>
                <select
                  value={formData.pricing_id}
                  onChange={(e) => setFormData({...formData, pricing_id: e.target.value})}
                  required
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                >
                  <option value="">Select pricing</option>
                  {pricing.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.label} - ₱{p.price}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Request Type</label>
                  <select
                    value={formData.client_type}
                    onChange={(e) => setFormData({...formData, client_type: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                  >
                    <option value="regular">Regular</option>
                    <option value="discounted">Discounted</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                  >
                    <option value="draft">Draft</option>
                    <option value="pending_discount_review">Pending Discount Review</option>
                    <option value="ready_for_payment">Ready for Payment</option>
                    <option value="completed">Completed</option>
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
                  {saving ? "Creating..." : "Create Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {showViewModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Request Details</h2>
              <button
                onClick={() => setShowViewModal(false)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* client Info */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-slate-600 flex items-center justify-center text-white font-medium">
                  {selectedRequest.client?.first_name?.charAt(0)}{selectedRequest.client?.last_name?.charAt(0)}
                </div>
                <div>
                  <p className="text-white font-medium">{selectedRequest.client?.first_name} {selectedRequest.client?.last_name}</p>
                  <p className="text-slate-400 text-sm">{selectedRequest.client?.email}</p>
                </div>
              </div>

              {/* Request Type */}
              <div>
                <label className="text-xs text-slate-400 uppercase">Request Type</label>
                <p className="text-white mt-1">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeBadge(selectedRequest.request_type)}`}>
                    {ucfirst(selectedRequest.request_type)}
                  </span>
                </p>
              </div>

              {/* Plan */}
              <div>
                <label className="text-xs text-slate-400 uppercase">Plan</label>
                <p className="text-white">{selectedRequest.plan?.label || "N/A"}</p>
              </div>

              {/* Status */}
              <div>
                <label className="text-xs text-slate-400 uppercase">Status</label>
                <p className="text-white mt-1">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(selectedRequest.status)}`}>
                    {formatStatus(selectedRequest.status)}
                  </span>
                </p>
              </div>

              {/* Date */}
              <div>
                <label className="text-xs text-slate-400 uppercase">Created At</label>
                <p className="text-white">{formatDate(selectedRequest.createdAt)}</p>
              </div>

              {/* Freeze Period - Only for freeze requests */}
              {selectedRequest.request_type === "freeze" && (
                <div>
                  <label className="text-xs text-slate-400 uppercase">Freeze Period</label>
                  <p className="text-white">
                    {selectedRequest.freeze_start_date && selectedRequest.freeze_end_date
                      ? `${formatDate(selectedRequest.freeze_start_date)} - ${formatDate(selectedRequest.freeze_end_date)}`
                      : "N/A"}
                  </p>
                </div>
              )}

              {/* Medical Proof - Only for freeze requests */}
              {selectedRequest.request_type === "freeze" && selectedRequest.medical_proof_url && (
                <div>
                  <label className="text-xs text-slate-400 uppercase">Medical Proof</label>
                  <button
                     onClick={() => handleViewMedicalProof(selectedRequest.medical_proof_url)}
                    className="mt-2 flex items-center gap-2 px-3 py-2 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 rounded-lg text-sm font-medium"
                  >
                    <Eye className="w-4 h-4" />
                    View Medical Proof
                  </button>
                </div>
              )}

              {/* Approve/Reject Buttons - Only for freeze requests with pending status */}
              {selectedRequest.request_type === "freeze" && selectedRequest.status === "pending" && (
                <div className="flex gap-3 pt-4 border-t border-slate-700">
                  <button
                    onClick={handleApprove}
                    disabled={processingAction}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Approve
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={processingAction}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Medical Proof Modal */}
      {showMedicalProof && selectedMedicalProof && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-slate-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Medical Proof</h2>
                <button
                  onClick={() => {
                    setShowMedicalProof(false);
                    setSelectedMedicalProof(null);
                    setSelectedMedicalProofType("");
                  }}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition"
                >
                ✕
              </button>
            </div>
             <div className="p-6">
               {selectedMedicalProofType === "image" ? (
                 <img 
                   src={selectedMedicalProof} 
                   alt="Medical Proof" 
                   className="max-w-full h-auto rounded-lg"
                 />
               ) : (
                 <iframe 
                   src={selectedMedicalProof} 
                   className="w-full h-96 rounded-lg"
                   title="Medical Proof"
                 />
               )}
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
