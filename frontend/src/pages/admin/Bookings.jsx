import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Calendar, 
  Search, 
  RefreshCw,
  Eye,
  XCircle,
  CheckCircle,
  X,
  Phone,
  Mail,
  MapPin,
  Clock,
  User
} from "lucide-react";
import api from "../../api/axios.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useNotification } from "../../context/NotificationContext.jsx";

export default function Bookings() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { success, error } = useNotification();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/admin/login");
    }
  }, [isAuthenticated, navigate]);

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("class");
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelBookingId, setCancelBookingId] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [trainerBookings, setTrainerBookings] = useState([]);
  const [classBookings, setClassBookings] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append("page", pagination.page);
      params.append("limit", pagination.limit);
      if (search) params.append("search", search);
      if (statusFilter) params.append("status", statusFilter);

      const [classRes, trainerRes] = await Promise.all([
        api.get(`/admin/bookings?${params.toString()}&type=class`),
        api.get(`/admin/bookings?page=1&limit=100&type=trainer-booking`)
      ]);

      console.log("Class Bookings:", trainerRes.data);

      setClassBookings(classRes.data.result || classRes.data.data || []);
      setTrainerBookings(trainerRes.data.result || trainerRes.data.data || []);
      
      const activeBookings = typeFilter === "class" 
        ? (classRes.data.result || classRes.data.data || [])
        : (trainerRes.data.result || trainerRes.data.data || []);
      
      setBookings(activeBookings);
      setPagination(prev => ({
        ...prev,
        total: activeBookings.length,
        totalPages: 1
      }));
    } catch (err) {
      console.error("Error fetching bookings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [pagination.page, search, statusFilter, typeFilter]);

  useEffect(() => {
    setBookings(typeFilter === "class" ? classBookings : trainerBookings);
  }, [typeFilter, classBookings, trainerBookings]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  const handleCancelBooking = async () => {
    if (!cancelBookingId) return;
    try {
      setCancelling(true);
      const response = await api.patch(`/client/booking/${cancelBookingId}`, {
        cancelReason: cancelReason
      });
      setShowCancelModal(false);
      setCancelBookingId(null);
      setCancelReason("");
      success(response.data?.message || "Booking cancelled successfully");
      fetchBookings();
    } catch (err) {
      console.error("Error cancelling booking:", err);
      error(err.response?.data?.message || "Failed to cancel booking");
    } finally {
      setCancelling(false);
    }
  };

  const openCancelModal = (bookingId) => {
    setCancelBookingId(bookingId);
    setCancelReason("");
    setShowCancelModal(true);
  };

  const handleConfirmBooking = async (id) => {
    try {
      const response = await api.patch(`/booking/${id}/confirm`);
      success(response.data?.result || "Booking confirmed successfully");
      fetchBookings();
    } catch (err) {
      console.error("Error confirming booking:", err);
      error(err.response?.data?.message || "Failed to confirm booking");
    }
  };

  const handleViewDetails = (booking) => {
    setSelectedBooking(booking);
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

  const formatTime = (time) => {
    if (!time) return "N/A";
    return time;
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case "confirmed":
        return "bg-green-600/20 text-green-400";
      case "cancelled":
        return "bg-red-600/20 text-red-400";
      case "pending":
        return "bg-yellow-600/20 text-yellow-400";
      case "on_going":
        return "bg-blue-600/20 text-blue-400";
      case "joined":
        return "bg-green-600/20 text-green-400";
      default:
        return "bg-slate-600/20 text-slate-400";
    }
  };

  return (
    <div className="p-4 sm:p-6 w-full max-w-[100vw] overflow-hidden space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Bookings</h1>
          <p className="text-slate-400 mt-1">
            {typeFilter === "class" ? "Manage class schedule bookings" : "Manage trainer bookings"}
          </p>
        </div>
        <button
          onClick={() => fetchBookings()}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-700/60 hover:bg-slate-600/80 backdrop-blur-sm text-white rounded-lg transition border border-white/10"
        >
          <RefreshCw className="w-5 h-5" />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 sm:w-5 h-4 sm:h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by client name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            className="w-full pl-9 sm:pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-red-500 text-sm sm:text-base"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setTypeFilter("class");
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            className={`px-4 py-2 rounded-lg transition ${
              typeFilter === "class"
                ? "bg-red-600 text-white"
                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
            }`}
          >
            Class ({classBookings.length})
          </button>
          <button
            onClick={() => {
              setTypeFilter("trainer-booking");
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            className={`px-4 py-2 rounded-lg transition ${
              typeFilter === "trainer-booking"
                ? "bg-red-600 text-white"
                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
            }`}
          >
            Trainer ({trainerBookings.length})
          </button>
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
          <option value="confirmed">Confirmed</option>
          <option value="cancelled">Cancelled</option>
          <option value="pending">Pending</option>
          <option value="joined">Joined</option>
        </select>
      </div>

      {/* Table */}
      <div className="fluid-card bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/10 shadow-xl shadow-black/20 w-full">
        <div className="table-wrapper overflow-auto">
          <table className="w-full min-w-[900px] lg:min-w-full divide-y divide-slate-700 table-sticky-header table-row-animated">
            <thead className="bg-slate-700/50">
              <tr>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider whitespace-nowrap">Client</th>
                {typeFilter === "class" && (
                  <>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider whitespace-nowrap hidden sm:table-cell">Trainer</th>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider whitespace-nowrap">Class</th>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider whitespace-nowrap hidden md:table-cell">Date & Time</th>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider whitespace-nowrap hidden lg:table-cell">Location</th>
                  </>
                )}
                {typeFilter === "trainer-booking" && (
                  <>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider whitespace-nowrap">Trainer</th>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider whitespace-nowrap hidden md:table-cell">Booked At</th>
                  </>
                )}
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider whitespace-nowrap">Status</th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider whitespace-nowrap">Actions</th>
              </tr>
            </thead>
              <tbody className="divide-y divide-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={typeFilter === "class" ? 7 : 5} className="px-3 sm:px-4 py-8 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Loading bookings...
                    </div>
                  </td>
                </tr>
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan={typeFilter === "class" ? 7 : 5} className="px-3 sm:px-4 py-8 text-center text-slate-400">
                    No bookings found
                  </td>
                </tr>
              ) : (
                bookings.map((booking) => (
                  <motion.tr
                    key={booking._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-slate-700/30"
                  >
                    <td className="px-3 sm:px-4 py-3 sm:py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-600 flex items-center justify-center text-white font-medium text-xs sm:text-sm">
                          {booking.client?.first_name?.charAt(0)}{booking.client?.last_name?.charAt(0)}
                        </div>
                        <div className="ml-3 sm:ml-4">
                          <div className="text-sm font-medium text-white">
                            {booking.client?.first_name} {booking.client?.last_name}
                          </div>
                          <div className="text-xs text-slate-400">{booking.client?.email}</div>
                        </div>
                      </div>
                    </td>
                    {typeFilter === "class" && (
                      <>
                    <td className="px-3 sm:px-4 py-3 sm:py-4 whitespace-nowrap hidden sm:table-cell">
                      <div className="text-sm text-white">
                        {booking.trainer?.first_name} {booking.trainer?.last_name}
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-3 sm:py-4 whitespace-nowrap">
                      <div className="text-sm text-white">
                        {booking.class?.name || "N/A"}
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-3 sm:py-4 whitespace-nowrap hidden md:table-cell">
                      <div className="text-sm text-white">
                        {booking.schedule?.start_at ? formatDate(booking.schedule.start_at) : "N/A"}
                      </div>
                      <div className="text-xs text-slate-400">
                        {booking.schedule?.start_at && booking.schedule?.end_at 
                          ? `${booking.schedule.start_at.split('T')[1]?.slice(0, 5) || ''} - ${booking.schedule.end_at.split('T')[1]?.slice(0, 5) || ''}`
                          : "N/A"}
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-3 sm:py-4 whitespace-nowrap hidden lg:table-cell">
                      <div className="text-sm text-slate-400">
                        {booking.schedule?.location || "N/A"}
                      </div>
                    </td>
                      </>
                    )}
                    {typeFilter === "trainer-booking" && (
                      <>
                    <td className="px-3 sm:px-4 py-3 sm:py-4 whitespace-nowrap">
                      <div className="text-sm text-white">
                        {booking.trainer?.first_name} {booking.trainer?.last_name}
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-3 sm:py-4 whitespace-nowrap hidden md:table-cell">
                      <div className="text-sm text-white">
                        {booking.bookedAt ? formatDate(booking.bookedAt) : "N/A"}
                      </div>
                    </td>
                      </>
                    )}
                    <td className="px-3 sm:px-4 py-3 sm:py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(booking.status)}`}>
                        {booking.status === "on_going" ? "On Going" : booking.status === "cancelled" ? "Cancelled" : booking.status?.charAt(0).toUpperCase() + booking.status?.slice(1) || "N/A"}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 py-3 sm:py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleViewDetails(booking)}
                          className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {booking.status === "pending" && (
                          <button
                            onClick={() => handleConfirmBooking(booking._id)}
                            className="p-2 text-slate-400 hover:text-green-400 hover:bg-slate-700 rounded-lg transition"
                            title="Confirm Booking"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        {booking.status !== "cancelled" && (
                          <button
                            onClick={() => openCancelModal(booking._id)}
                            className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg transition"
                            title="Cancel Booking"
                          >
                            <XCircle className="w-4 h-4" />
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
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} bookings
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

      {/* Booking Detail Modal */}
      {showDetailModal && selectedBooking && (
        <>
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-lg max-h-[90vh] overflow-y-auto">
          <div className="p-4 sm:p-6 border-b border-slate-700 flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-bold text-white">Booking Details</h2>
            <button
              onClick={() => setShowDetailModal(false)}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-4 sm:p-6 space-y-4">
            {/* Status */}
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-sm">Status</span>
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusBadge(selectedBooking.status)}`}>
                {selectedBooking.status === "on_going" ? "On Going" : selectedBooking.status || "N/A"}
              </span>
            </div>

            {/* client */}
            <div className="bg-slate-700/30 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2 text-white font-medium">
                <User className="w-4 h-4" />
                client Information
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-sm w-20">Name:</span>
                  <span className="text-white text-sm">
                    {selectedBooking.client?.first_name} {selectedBooking.client?.last_name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span className="text-white text-sm">{selectedBooking.client?.email || "N/A"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span className="text-white text-sm">{selectedBooking.client?.phone || "N/A"}</span>
                </div>
              </div>
            </div>

            {/* Trainer */}
            {selectedBooking.trainer && (
              <div className="bg-slate-700/30 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2 text-white font-medium">
                  <User className="w-4 h-4" />
                  Trainer Information
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-sm w-20">Name:</span>
                    <span className="text-white text-sm">
                      {selectedBooking.trainer?.first_name} {selectedBooking.trainer?.last_name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span className="text-white text-sm">{selectedBooking.trainer?.email || "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span className="text-white text-sm">{selectedBooking.trainer?.phone || "N/A"}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Class */}
            <div className="bg-slate-700/30 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2 text-white font-medium">
                <Calendar className="w-4 h-4" />
                Class Information
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-sm w-20">Class:</span>
                  <span className="text-white text-sm">{selectedBooking.class?.name || "N/A"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span className="text-white text-sm">
                    {selectedBooking.schedule?.start_at ? formatDate(selectedBooking.schedule.start_at) : "N/A"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span className="text-white text-sm">
                    {selectedBooking.schedule?.start_at && selectedBooking.schedule?.end_at 
                      ? `${selectedBooking.schedule.start_at.split('T')[1]?.slice(0, 5) || ''} - ${selectedBooking.schedule.end_at.split('T')[1]?.slice(0, 5) || ''}`
                      : "N/A"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span className="text-white text-sm">{selectedBooking.schedule?.location || "N/A"}</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            {selectedBooking.notes && (
              <div className="bg-slate-700/30 rounded-lg p-4 space-y-2">
                <div className="text-white font-medium">Notes</div>
                <p className="text-slate-400 text-sm">{selectedBooking.notes}</p>
              </div>
            )}

            {/* Cancel Reason */}
            {selectedBooking.cancelReason && (
              <div className="bg-slate-700/30 rounded-lg p-4 space-y-2">
                <div className="text-white font-medium">Cancel Reason</div>
                <p className="text-slate-400 text-sm">{selectedBooking.cancelReason}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-4 border-t border-slate-700">
              {selectedBooking.status === "pending" && (
                <button
                  onClick={() => {
                    handleConfirmBooking(selectedBooking._id);
                    setShowDetailModal(false);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
                >
                  <CheckCircle className="w-4 h-4" />
                  Confirm
                </button>
              )}
              {selectedBooking.status !== "cancelled" && (
                <button
                  onClick={() => {
                    openCancelModal(selectedBooking._id);
                    setShowDetailModal(false);
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition ${
                    selectedBooking.status === "pending" ? "" : ""
                  }`}
                >
                  <XCircle className="w-4 h-4" />
                  Cancel Booking
                </button>
              )}
            </div>
          </div>
        </div>
        </div>
        </>
      )}

      {/* Cancel Booking Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-md">
            <div className="p-6 border-b border-slate-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Cancel Booking</h2>
              <button
                onClick={() => setShowCancelModal(false)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-slate-300">
                Are you sure you want to cancel this booking? This action cannot be undone.
              </p>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Reason for cancellation (optional)</label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                  placeholder="Enter reason for cancellation..."
                  rows={3}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
                >
                  No, Keep Booking
                </button>
                <button
                  onClick={handleCancelBooking}
                  disabled={cancelling}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition disabled:opacity-50"
                >
                  {cancelling ? "Cancelling..." : "Yes, Cancel Booking"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
