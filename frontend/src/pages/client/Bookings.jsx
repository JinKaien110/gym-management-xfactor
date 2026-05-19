// pages/client/Bookings.jsx
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { useNotification } from "../../context/NotificationContext.jsx";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../api/axios.js";
import ConfirmationDialog from "../../components/ConfirmationDialog.jsx";
import Modal from "../../components/Modal.jsx";
import {
  Calendar,
  Clock,
  Users,
  MapPin,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  User,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  CreditCard,
  Eye
} from "lucide-react";

export default function Bookings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { success, error } = useNotification();

  const [allBookings, setAllBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Confirmation Dialog State
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [selectedBookingForComplete, setSelectedBookingForComplete] = useState(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [selectedBookingForCancel, setSelectedBookingForCancel] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // View Details Modal State
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedBookingForDetails, setSelectedBookingForDetails] = useState(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // Derived: Filtered bookings
  const filteredBookings = useMemo(() => {
    return allBookings.filter(booking => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesClass = booking.class_name?.toLowerCase().includes(query);
        const matchesTrainer = booking.trainer_name?.toLowerCase().includes(query);
        const matchesId = booking._id?.toLowerCase().includes(query);
        const matchesRef = booking.booking?.reference_no?.toLowerCase().includes(query);
        if (!(matchesClass || matchesTrainer || matchesId || matchesRef)) return false;
      }

      // Type filter
      if (typeFilter && booking.type !== typeFilter) return false;

      // Status filter
      if (statusFilter && booking.status !== statusFilter) return false;

      return true;
    });
  }, [allBookings, searchQuery, statusFilter, typeFilter]);

  // Derived: Paginated bookings
  const bookings = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredBookings.slice(start, start + limit);
  }, [filteredBookings, page, limit]);

  // Derived: total pages
  const totalPages = Math.ceil(filteredBookings.length / limit);

  useEffect(() => {
    fetchBookings();
  }, []); // Fetch once on mount

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter, typeFilter]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);

      const response = await api.get("/client/my-bookings");
      const data = response.data.data || response.data.result || [];

      // Transform bookings
      const transformed = data.map(booking => {
        const isTrainerBooking = !!booking.trainer?.trainer_id;
        const trainerFirstName = booking.trainer?.first_name?.trim() || '';
        const trainerLastName = booking.trainer?.last_name?.trim() || '';
        const trainerName = (trainerFirstName || trainerLastName) ? `${trainerFirstName} ${trainerLastName}`.trim() : null;

        const scheduleStart = booking.schedule?.start_at || booking.class?.start_at || booking.createdAt;
        const scheduleEnd = booking.schedule?.end_at || booking.class?.end_at;

        const formatDate = (dateStr) => {
          if (!dateStr) return "N/A";
          return new Date(dateStr).toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' });
        };

        const formatTime = (dateStr) => {
          if (!dateStr) return "TBD";
          return new Date(dateStr).toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' });
        };

        return {
          ...booking,
          type: isTrainerBooking ? 'trainer' : 'class',
          class_name: isTrainerBooking
            ? (trainerName ? `${trainerName} Session` : "Trainer Session")
            : (booking.class?.name || booking.class_name || "Fitness Class"),
          schedule_id: booking.schedule?.schedule_id,
          trainer_id: booking.trainer?.trainer_id,
          trainer_name: trainerName,
          schedule_start: scheduleStart,
          schedule_end: scheduleEnd,
          hours: booking.booking?.hours,
          date: formatDate(scheduleStart),
          time: formatTime(scheduleStart),
          status: (booking.booking?.status || booking.status || 'pending').toLowerCase(),
        };
      });

      setAllBookings(transformed);
    } catch (err) {
      console.error("Error fetching bookings:", err);
      setErrorMsg("Failed to load bookings. Please try again.");
      setAllBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'N/A';
    return `₱${parseFloat(amount).toLocaleString('en-US')}`;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'joined':
      case 'in_training':
      case 'on_going':
      case 'completed':
        return 'bg-green-500/20 text-green-400 border border-green-500/30';
      case 'cancelled':
        return 'bg-red-500/20 text-red-400 border border-red-500/30';
      case 'pending':
      default:
        return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
    }
  };

  const getDisplayStatus = (status) => {
    switch (status) {
      case 'in_training': return 'In Training';
      case 'on_going': return 'On going';
      case 'joined': return 'Joined';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return status.replace('_', ' ');
    }
  };

   const clearFilters = () => {
     setStatusFilter("");
     setTypeFilter("");
     setSearchQuery("");
   };

  const handleCompleteBooking = async (booking) => {
    if (!booking || !booking._id) return;
    setSelectedBookingForComplete(booking);
    setShowCompleteDialog(true);
  };

  const handleCancelBooking = async (bookingId) => {
    if (!bookingId) return;
    setSelectedBookingForCancel(bookingId);
    setShowCancelDialog(true);
  };

  const handleViewDetails = (booking) => {
    setSelectedBookingForDetails(booking);
    setShowDetailsModal(true);
  };

  const confirmCompleteBooking = async () => {
    if (!selectedBookingForComplete || !selectedBookingForComplete._id) return;
    
    try {
      setActionLoading(true);
      await api.patch(`/client/booking/trainer/${selectedBookingForComplete._id}/complete`);
      success("Training session marked as completed!");
      setShowCompleteDialog(false);
      setSelectedBookingForComplete(null);
      fetchBookings();
    } catch (err) {
      console.error("Error completing booking:", err);
      error(err.response?.data?.message || "Failed to complete booking");
    } finally {
      setActionLoading(false);
    }
  };

  const confirmCancelBooking = async () => {
    if (!selectedBookingForCancel) return;
    
    try {
      setActionLoading(true);
      await api.patch(`/client/booking/${selectedBookingForCancel}`, {
        status: "cancelled",
        cancelReason: "Cancelled by client"
      });
      success("Booking cancelled successfully!");
      setShowCancelDialog(false);
      setSelectedBookingForCancel(null);
      fetchBookings();
    } catch (err) {
      console.error("Error cancelling booking:", err);
      error(err.response?.data?.message || "Failed to cancel booking");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            MY <span className="text-red-500">BOOKINGS</span>
          </h1>
          <p className="text-slate-400">
            View and manage your class and trainer session bookings
          </p>
        </motion.div>

        {/* Search & Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by class, trainer, or booking ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-red-500"
              />
            </div>

            {/* Filter Toggle Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl border transition-colors ${
                showFilters || statusFilter || typeFilter
                  ? "bg-red-600/10 border-red-600/30 text-red-400"
                  : "bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600"
              }`}
            >
              <Filter className="w-5 h-5" />
              <span>Filters</span>
              {(statusFilter || typeFilter) && (
                <span className="w-2 h-2 rounded-full bg-red-500" />
              )}
              {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          {/* Filters Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="pt-4 space-y-4">
                  {/* Type Filter */}
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Booking Type</label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setTypeFilter("")}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                          !typeFilter
                            ? "bg-red-600 text-white"
                            : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                        }`}
                      >
                        All
                      </button>
                      <button
                        onClick={() => setTypeFilter("class")}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                          typeFilter === "class"
                            ? "bg-red-600 text-white"
                            : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                        }`}
                      >
                        Class
                      </button>
                      <button
                        onClick={() => setTypeFilter("trainer")}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                          typeFilter === "trainer"
                            ? "bg-red-600 text-white"
                            : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                        }`}
                      >
                        Trainer
                      </button>
                    </div>
                  </div>

                  {/* Status Filter */}
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Status</label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setStatusFilter("")}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                          !statusFilter
                            ? "bg-red-600 text-white"
                            : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                        }`}
                      >
                        All
                      </button>
                      <button
                        onClick={() => setStatusFilter("joined")}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                          statusFilter === "joined"
                            ? "bg-red-600 text-white"
                            : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                        }`}
                      >
                        Joined
                      </button>
                      <button
                        onClick={() => setStatusFilter("pending")}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                          statusFilter === "pending"
                            ? "bg-red-600 text-white"
                            : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                        }`}
                      >
                        Pending
                      </button>
                      <button
                        onClick={() => setStatusFilter("cancelled")}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                          statusFilter === "cancelled"
                            ? "bg-red-600 text-white"
                            : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                        }`}
                      >
                        Cancelled
                      </button>
                    </div>
                  </div>

                  {/* Clear Filters */}
                  {(statusFilter || typeFilter || searchQuery) && (
                    <button
                      onClick={clearFilters}
                      className="text-sm text-slate-400 hover:text-red-400 transition"
                    >
                      Clear all filters
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Results Count */}
        {!loading && (
          <div className="mb-4 text-sm text-slate-400">
            {filteredBookings.length > 0
              ? `Showing ${filteredBookings.length} booking${filteredBookings.length > 1 ? "s" : ""}`
              : "No bookings match your criteria"}
          </div>
        )}

        {/* Bookings List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-10 h-10 text-red-600 animate-spin" />
              <span className="text-slate-400">Loading bookings...</span>
            </div>
          </div>
        ) : errorMsg ? (
          <div className="text-center py-20">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-400">{errorMsg}</p>
            <button
              onClick={fetchBookings}
              className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
            >
              Try Again
            </button>
          </div>
         ) : filteredBookings.length === 0 ? (
           <div className="text-center py-20">
             <Calendar className="w-16 h-16 text-slate-600 mx-auto mb-4" />
             <h3 className="text-xl font-semibold text-white mb-2">No Bookings Found</h3>
             <p className="text-slate-400 mb-6">
               {searchQuery || statusFilter || typeFilter
                 ? "No bookings match your current filters. Try adjusting them."
                 : "You haven't made any class or trainer bookings yet."}
             </p>
             <div className="flex flex-col sm:flex-row gap-3 justify-center">
               {(searchQuery || statusFilter || typeFilter) && (
                 <button
                   onClick={clearFilters}
                   className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl transition"
                 >
                   Clear Filters
                 </button>
               )}
               {!searchQuery && !statusFilter && !typeFilter && (
                 <button
                   onClick={() => navigate('/client/dashboard')}
                   className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition"
                 >
                   Go to Dashboard
                 </button>
               )}
             </div>
           </div>
        ) : (
          <>
            {/* Bookings Table/List */}
            <div className="space-y-3">
              {bookings.map((booking, index) => (
                <motion.div
                  key={booking._id || index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(index * 0.05, 0.3) }}
                  className="bg-slate-800/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 hover:border-red-600/50 transition-all"
                >
                  <div className="flex flex-col md:flex-row gap-4">
                    {/* Icon */}
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0 ${
                      booking.type === 'trainer'
                        ? 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/20'
                        : 'bg-gradient-to-br from-violet-500 to-purple-600 shadow-purple-500/20'
                    }`}>
                      {booking.type === 'trainer' ? (
                        <User className="w-6 h-6 text-white" />
                      ) : (
                        <Users className="w-6 h-6 text-white" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                        <h3 className="text-lg font-bold text-white truncate">
                          {booking.class_name}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border w-fit ${
                          getStatusBadge(booking.status)
                        }`}>
                          {getDisplayStatus(booking.status)}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                        {/* Date & Time */}
                        <div className="flex items-center gap-2 text-slate-300">
                          <Calendar className="w-4 h-4 text-red-400 flex-shrink-0" />
                          <span>{booking.date}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-300">
                          <Clock className="w-4 h-4 text-blue-400 flex-shrink-0" />
                          <span>{booking.time}</span>
                        </div>

                        {/* Trainer (for trainer bookings) */}
                        {booking.type === 'trainer' && booking.trainer_name && (
                          <div className="flex items-center gap-2 text-slate-300">
                            <User className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                            <span>{booking.trainer_name}</span>
                          </div>
                        )}

                        {/* Hours (for trainer bookings) */}
                        {booking.type === 'trainer' && booking.hours && (
                          <div className="flex items-center gap-2 text-slate-300">
                            <Clock className="w-4 h-4 text-amber-400 flex-shrink-0" />
                            <span>{booking.hours} hour{booking.hours > 1 ? 's' : ''}</span>
                          </div>
                        )}
                      </div>

                      {/* Additional Details Row */}
                      <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-400">
                        {booking.schedule?.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {booking.schedule.location}
                          </span>
                        )}
                        {booking.booking?.reference_no && (
                          <span className="flex items-center gap-1">
                            <CreditCard className="w-3 h-3" />
                            Ref: {booking.booking.reference_no.substring(0, 12)}...
                          </span>
                        )}
                        {booking.type === 'trainer' && booking.trainer?.email && (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {booking.trainer.email}
                          </span>
                        )}
                      </div>
                    </div>

                     {/* Actions (if any) */}
                     <div className="flex-shrink-0 flex flex-col gap-2">
                       {/* View Details button */}
                       <button
                         onClick={(e) => {
                           e.stopPropagation();
                           handleViewDetails(booking);
                         }}
                         className="w-10 h-10 rounded-lg text-blue-400 hover:text-blue-300 hover:bg-white/5 transition-all flex items-center justify-center"
                         title="View details"
                       >
                         <Eye className="w-5 h-5" />
                       </button>

                      {/* Complete button for trainer bookings */}
                      {booking.type === 'trainer' && booking.status === "on_going" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCompleteBooking(booking);
                          }}
                          className="w-10 h-10 rounded-lg text-green-400 hover:text-green-300 hover:bg-white/5 transition-all flex items-center justify-center"
                          title="Mark as completed"
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                      )}

                      {/* Cancel button for class bookings */}
                      {booking.type === 'class' && booking.status === 'joined' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCancelBooking(booking._id);
                          }}
                          className="w-10 h-10 rounded-lg text-red-400 hover:text-red-300 hover:bg-white/5 transition-all flex items-center justify-center"
                          title="Cancel booking"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Previous
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => {
                    if (
                      p === 1 ||
                      p === totalPages ||
                      (p >= page - 1 && p <= page + 1)
                    ) {
                      return (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          className={`w-10 h-10 rounded-lg font-medium transition ${
                            p === page
                              ? "bg-red-600 text-white"
                              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                          }`}
                        >
                          {p}
                        </button>
                      );
                    } else if (p === page - 2 || p === page + 2) {
                      return <span key={p} className="text-slate-500">...</span>;
                    }
                    return null;
                  })}
                </div>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Confirmation Dialogs */}
      <ConfirmationDialog
        isOpen={showCompleteDialog}
        onClose={() => {
          setShowCompleteDialog(false);
          setSelectedBookingForComplete(null);
        }}
        onConfirm={confirmCompleteBooking}
        title="Complete Training Session"
        message={`Are you sure you want to mark this training session with ${selectedBookingForComplete?.trainer_name || 'the trainer'} as completed? This action cannot be undone.`}
        type="warning"
        confirmText="Complete"
        cancelText="Cancel"
        loading={actionLoading}
      />

      <ConfirmationDialog
        isOpen={showCancelDialog}
        onClose={() => {
          setShowCancelDialog(false);
          setSelectedBookingForCancel(null);
        }}
        onConfirm={confirmCancelBooking}
        title="Cancel Class Booking"
        message="Are you sure you want to cancel this class booking? You may not be able to rebook the same class."
        type="danger"
        confirmText="Cancel Booking"
        cancelText="Keep Booking"
        loading={actionLoading}
       />

      {/* Booking Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedBookingForDetails(null);
        }}
        title={selectedBookingForDetails?.type === 'trainer' ? "Trainer Session Details" : "Class Booking Details"}
        size="md"
      >
        {selectedBookingForDetails && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-700/30 border border-slate-600/50">
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                selectedBookingForDetails.type === 'trainer'
                  ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
                  : 'bg-gradient-to-br from-violet-500 to-purple-600'
              }`}>
                {selectedBookingForDetails.type === 'trainer' ? (
                  <User className="w-7 h-7 text-white" />
                ) : (
                  <Users className="w-7 h-7 text-white" />
                )}
              </div>
              <div>
                <h4 className="text-white font-semibold text-lg">
                  {selectedBookingForDetails.class_name || "Fitness Class"}
                </h4>
                <p className="text-slate-400 text-sm">
                  {selectedBookingForDetails.type === 'trainer' ? 'Personal Training Session' : 'Group Fitness Class'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-slate-800/50">
                <p className="text-slate-400 text-xs mb-1">Date</p>
                <p className="text-white font-medium">{selectedBookingForDetails.date || "N/A"}</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-800/50">
                <p className="text-slate-400 text-xs mb-1">Time</p>
                <p className="text-white font-medium">{selectedBookingForDetails.time || "TBD"}</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-800/50">
                <p className="text-slate-400 text-xs mb-1">Status</p>
                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                  selectedBookingForDetails.status === 'joined' || selectedBookingForDetails.status === 'in_training' || selectedBookingForDetails.status === 'on_going' || selectedBookingForDetails.status === 'completed'
                    ? 'bg-green-500/20 text-green-400'
                    : selectedBookingForDetails.status === 'cancelled'
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {selectedBookingForDetails.status === 'in_training' ? 'In Training' :
                   selectedBookingForDetails.status === 'on_going' ? 'Ongoing' :
                   selectedBookingForDetails.status === 'joined' ? 'Joined' :
                   selectedBookingForDetails.status === 'completed' ? 'Completed' : selectedBookingForDetails.status === 'cancelled' ? 'Cancelled' : selectedBookingForDetails.status.replace('_', ' ')} 
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-800/50">
                <p className="text-slate-400 text-xs mb-1">Booking Type</p>
                <p className="text-white font-medium capitalize">{selectedBookingForDetails.type || "Class"}</p>
              </div>

              {selectedBookingForDetails.type === 'trainer' && selectedBookingForDetails.hours && (
                <div className="p-3 rounded-lg bg-slate-800/50">
                  <p className="text-slate-400 text-xs mb-1">Duration</p>
                  <p className="text-white font-medium">{selectedBookingForDetails.hours} hour(s)</p>
                </div>
              )}

              {selectedBookingForDetails.schedule_id && (
                <div className="p-3 rounded-lg bg-slate-800/50">
                  <p className="text-slate-400 text-xs mb-1">Schedule ID</p>
                  <p className="text-white font-mono text-sm">{selectedBookingForDetails.schedule_id}</p>
                </div>
              )}

              {selectedBookingForDetails.trainer_id && (
                <div className="p-3 rounded-lg bg-slate-800/50">
                  <p className="text-slate-400 text-xs mb-1">Trainer</p>
                  <p className="text-white font-medium">{selectedBookingForDetails.trainer_name || "N/A"}</p>
                </div>
              )}

              {selectedBookingForDetails.booking?.reference_no && (
                <div className="p-3 rounded-lg bg-slate-800/50">
                  <p className="text-slate-400 text-xs mb-1">Reference No</p>
                  <p className="text-white font-mono text-sm">{selectedBookingForDetails.booking.reference_no}</p>
                </div>
              )}

              {selectedBookingForDetails.schedule?.location && (
                <div className="p-3 rounded-lg bg-slate-800/50">
                  <p className="text-slate-400 text-xs mb-1">Location</p>
                  <p className="text-white font-medium">{selectedBookingForDetails.schedule.location}</p>
                </div>
              )}

              {selectedBookingForDetails.schedule?.notes && (
                <div className="p-3 rounded-lg bg-slate-800/50 col-span-2">
                  <p className="text-slate-400 text-xs mb-1">Notes</p>
                  <p className="text-white font-medium text-sm">{selectedBookingForDetails.schedule.notes}</p>
                </div>
              )}

              <div className="p-3 rounded-lg bg-slate-800/50">
                <p className="text-slate-400 text-xs mb-1">Created</p>
                <p className="text-white font-medium text-sm">
                  {selectedBookingForDetails.createdAt ? new Date(selectedBookingForDetails.createdAt).toLocaleDateString() : "N/A"}
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
