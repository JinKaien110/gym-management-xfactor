import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  CreditCard, 
  Search, 
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  X
} from "lucide-react";
import api from "../../api/axios.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useNotification } from "../../context/NotificationContext.jsx";
const BASE_URL = import.meta.env.VITE_API;

const SecureImage = ({ path, alt, className, onClick }) => {
  const [imgSrc, setImgSrc] = useState(null);

  useEffect(() => {
    if (!path) return;
    
    let objectURL;
    const fetchImage = async () => {
      try {
        const cleanPath = path.replace(/\\/g, '/');
        const urlPath = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
        
        // Fetch using the api instance to include credentials/headers
        const response = await api.get(urlPath, {
          responseType: 'blob',
          baseURL: api.defaults.baseURL.replace(/\/api$/, '')
        });
        
        objectURL = URL.createObjectURL(response.data);
        setImgSrc(objectURL);
      } catch (err) {
        console.error("Error fetching image:", err);
      }
    };

    fetchImage();
    return () => {
      if (objectURL) URL.revokeObjectURL(objectURL);
    };
  }, [path]);

  if (!imgSrc) {
    return (
      <div className={`${className} bg-slate-700/50 animate-pulse flex items-center justify-center border border-slate-600`}>
        <RefreshCw className="w-5 h-5 text-slate-500 animate-spin" />
      </div>
    );
  }

  return (
    <img 
      src={imgSrc} 
      alt={alt} 
      className={className} 
      onClick={() => onClick?.(imgSrc)} 
    />
  );
};

export default function Discounts() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { success, error } = useNotification();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/admin/login");
    }
  }, [isAuthenticated, navigate]);

  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [selectedDiscount, setSelectedDiscount] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [processing, setProcessing] = useState(false);

  const fetchDiscounts = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append("page", pagination.page);
      params.append("limit", pagination.limit);
      if (search) params.append("search", search);
      if (statusFilter) params.append("status", statusFilter);

      const response = await api.get(`/admin/discounts?${params.toString()}`);
      console.log("Discounts response:", response.data);
      setDiscounts(response.data.data || response.data.result || []);
      setPagination(prev => ({
        ...prev,
        total: response.data.total || 0,
        totalPages: response.data.pages || 0
      }));
    } catch (err) {
      console.error("Error fetching discounts:", err);
      error("Failed to fetch discount requests");
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, statusFilter, error]);

  useEffect(() => {
    fetchDiscounts();
  }, [fetchDiscounts]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  const handleDecision = async (id, decision) => {
    if (!window.confirm(`Are you sure you want to ${decision} this discount request?`)) return;
    try {
      setProcessing(true);
      const response = await api.patch(`/discount-request/${id}/decision`, { decision });
      console.log("Decision response:", response.data);
      success(response.data?.message || `Discount request ${decision} successfully`);
      fetchDiscounts();
      setShowDetailModal(false);
    } catch (err) {
      console.error("Error processing discount decision:", err);
      error(err.response?.data?.message || "Failed to process discount request");
    } finally {
      setProcessing(false);
    }
  };

  const handleViewDetails = async (discount) => {
    setSelectedDiscount(discount);
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
      case "paid":
        return "bg-blue-600/20 text-blue-400";
      case "pending":
      case "submitted":
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
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Discount Request</h1>
          <p className="text-slate-400 mt-1">Manage discount requests</p>
        </div>
        <button
          onClick={() => fetchDiscounts()}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-700/60 hover:bg-slate-600/80 backdrop-blur-sm text-white rounded-lg transition border border-white/10"
        >
          <RefreshCw className="w-5 h-5" />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
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
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPagination(prev => ({ ...prev, page: 1 }));
          }}
          className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-red-500"
        >
          <option value="">All Status</option>
          <option value="submitted">Submitted</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Table */}
      <div className="fluid-card bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/10 shadow-xl shadow-black/20">
        <div className="table-wrapper overflow-auto">
          <table className="w-full table-sticky-header table-row-animated">
            <thead className="bg-slate-700/50">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Client</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider hidden md:table-cell">Requested</th>
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
                      Loading discount requests...
                    </div>
                  </td>
                </tr>
              ) : discounts.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-slate-400">
                    No discount requests found
                  </td>
                </tr>
              ) : (
                discounts.map((discount) => (
                  <motion.tr
                    key={discount._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-slate-700/30"
                  >
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center text-white font-medium">
                          {discount.client?.first_name?.charAt(0)}{discount.client?.last_name?.charAt(0)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-white">
                            {discount.client?.first_name} {discount.client?.last_name}
                          </div>
                          <div className="text-xs text-slate-400">{discount.client?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden md:table-cell">
                      <div className="text-sm text-slate-400">{formatDate(discount.requested_at || discount.createdAt)}</div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(discount.status)}`}>
                        {discount.status?.charAt(0).toUpperCase() + discount.status?.slice(1)}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleViewDetails(discount)}
                          className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {discount.status === "pending" && (
                          <>
                            <button
                              onClick={() => handleDecision(discount._id, "approved")}
                              disabled={processing}
                              className="p-2 text-slate-400 hover:text-green-400 hover:bg-slate-700 rounded-lg transition disabled:opacity-50"
                              title="Approve"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDecision(discount._id, "rejected")}
                              disabled={processing}
                              className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg transition disabled:opacity-50"
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
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} discount requests
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
      {showDetailModal && selectedDiscount && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Discount Request Details</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">client Name</label>
                  <p className="text-white">
                    {selectedDiscount.client?.first_name} {selectedDiscount.client?.last_name}
                  </p>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Phone</label>
                  <p className="text-white">{selectedDiscount.client?.phone || "N/A"}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Email</label>
                <p className="text-white">{selectedDiscount.client?.email || "N/A"}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Request Type</label>
                  <p className="text-white">{(selectedDiscount.membership_request?.request_type || "N/A").charAt(0).toUpperCase() + (selectedDiscount.membership_request?.request_type || "N/A").slice(1)}</p>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">client Type</label>
                  <p className="text-white">{(selectedDiscount.membership_request?.client_type || "N/A").charAt(0).toUpperCase() + (selectedDiscount.membership_request?.client_type || "N/A").slice(1)}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Plan</label>
                  <p className="text-white">{selectedDiscount.plan?.label || "N/A"}</p>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Duration</label>
                  <p className="text-white">{selectedDiscount.plan?.duration || "N/A"} ({selectedDiscount.plan?.duration_days} days)</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Pricing Type</label>
                  <p className="text-white">{(selectedDiscount.pricing?.type || "N/A").charAt(0).toUpperCase() + (selectedDiscount.pricing?.type || "N/A").slice(1)}</p>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Price</label>
                  <p className="text-white">₱{selectedDiscount.pricing?.price?.toLocaleString() || "N/A"}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Status</label>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(selectedDiscount.status)}`}>
                  {(selectedDiscount.status || "").charAt(0).toUpperCase() + (selectedDiscount.status || "").slice(1)}
                </span>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Requested Date</label>
                <p className="text-white">{formatDate(selectedDiscount.requested_at || selectedDiscount.createdAt)}</p>
              </div>
              
              {/* Verification Photos */}
              <div className="grid grid-cols-2 gap-4">
                {selectedDiscount.id_url && (
                  <div className="space-y-2">
                    <label className="block text-sm text-slate-400 mb-1">ID Image</label>
                    <div 
                      className="relative group cursor-pointer"
                    >
                      <SecureImage 
                        path={selectedDiscount.id_url}
                        alt="ID"
                        className="w-full h-32 object-cover rounded-lg border border-slate-600 hover:border-blue-500 transition-colors"
                        onClick={(url) => {
                          setSelectedPhoto(url);
                          setShowPhotoModal(true);
                        }}
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-lg transition-opacity">
                        <Eye className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </div>
                )}
                {selectedDiscount.selfie_url && (
                  <div className="space-y-2">
                    <label className="block text-sm text-slate-400 mb-1">Selfie Image</label>
                    <div 
                      className="relative group cursor-pointer"
                    >
                      <SecureImage 
                        path={selectedDiscount.selfie_url}
                        alt="Selfie"
                        className="w-full h-32 object-cover rounded-lg border border-slate-600 hover:border-blue-500 transition-colors"
                        onClick={(url) => {
                          setSelectedPhoto(url);
                          setShowPhotoModal(true);
                        }}
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-lg transition-opacity">
                        <Eye className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {(selectedDiscount.status === "submitted" || selectedDiscount.status === "pending") && (
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    onClick={() => handleDecision(selectedDiscount._id, "rejected")}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleDecision(selectedDiscount._id, "approved")}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
                  >
                    Approve
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Photo Modal */}
      {showPhotoModal && selectedPhoto && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setShowPhotoModal(false)}
        >
          <div className="relative max-w-full max-h-full">
            <button
              onClick={() => setShowPhotoModal(false)}
              className="absolute -top-10 right-0 text-white hover:text-slate-300"
            >
              <X className="w-6 h-6" />
            </button>
            <img 
              src={selectedPhoto} 
              alt="Photo" 
              className="max-w-full max-h-[80vh] rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
