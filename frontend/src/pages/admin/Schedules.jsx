import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Calendar, 
  Search, 
  RefreshCw,
  Edit, 
  Plus,
  ToggleLeft,
  ToggleRight,
  Clock,
  User,
  Eye,
  Archive,
  XCircle
} from "lucide-react";
import api from "../../api/axios.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useNotification } from "../../context/NotificationContext.jsx";

export default function Schedules() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { success, error } = useNotification();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/admin/login");
    }
  }, [isAuthenticated, navigate]);

  const [schedules, setSchedules] = useState([]);
  const [classes, setClasses] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [trainerFilter, setTrainerFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");
  const [startTimeFilter, setStartTimeFilter] = useState("");
  const [endTimeFilter, setEndTimeFilter] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
   const [saving, setSaving] = useState(false);
   const [bookingTab, setBookingTab] = useState("joined");
   const [bookings, setBookings] = useState({ joined: [], cancelled: [] });
   const [loadingBookings, setLoadingBookings] = useState(false);
   const [editingSchedule, setEditingSchedule] = useState(null);
   const [showCancelModal, setShowCancelModal] = useState(false);
   const [cancellingSchedule, setCancellingSchedule] = useState(null);
  const [formData, setFormData] = useState({
    class_id: "",
    start_at: "",
    end_at: "",
    capacity: "",
    trainer_id: "",
    location: "",
    notes: ""
  });

   const fetchSchedules = async () => {
     try {
       setLoading(true);
       const params = new URLSearchParams();
       params.append("page", pagination.page);
       params.append("limit", pagination.limit);
       if (search) params.append("search", search);
       if (classFilter) params.append("class_id", classFilter);
       if (trainerFilter) params.append("trainer_id", trainerFilter);
       if (statusFilter) params.append("status", statusFilter);
       if (startDateFilter) params.append("start_at", `${startDateFilter}T${startTimeFilter || '00:00'}:00.000Z`);
       if (endDateFilter) params.append("end_at", `${endDateFilter}T${endTimeFilter || '23:59'}:59.999Z`);

       const response = await api.get(`/admin/schedules?${params.toString()}`);
       console.log("Schedules response:", response.data);
       setSchedules(response.data.result || response.data.data || []);
       setPagination(prev => ({
         ...prev,
         total: response.data.total || 0,
         totalPages: response.data.totalPages || 0
       }));
     } catch (err) {
       console.error("Error fetching schedules:", err);
     } finally {
       setLoading(false);
     }
   };

   const fetchClasses = async () => {
     try {
       const response = await api.get("/admin/classes?limit=100");
       // Normalize _id to string (handle MongoDB ObjectId wrapper)
       const rawClasses = response.data.data || response.data.result || [];
       const normalized = rawClasses.map(cls => ({
         ...cls,
         _id: cls._id?.$oid || cls._id
       }));
       setClasses(normalized);
     } catch (err) {
       console.error("Error fetching classes:", err);
     }
   };

   const fetchTrainers = async () => {
     try {
       const response = await api.get("/admin/trainers?limit=100");
       // Normalize _id to string (handle MongoDB ObjectId wrapper)
       const rawTrainers = response.data.data || response.data.result || [];
       const normalized = rawTrainers.map(trainer => ({
         ...trainer,
         _id: trainer._id?.$oid || trainer._id
       }));
       setTrainers(normalized);
     } catch (err) {
       console.error("Error fetching trainers:", err);
     }
   };

  useEffect(() => {
    fetchSchedules();
    fetchClasses();
    fetchTrainers();
  }, [pagination.page, search, classFilter, trainerFilter, statusFilter, startDateFilter, endDateFilter, startTimeFilter, endTimeFilter]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

   const handleSubmit = async (e) => {
     e.preventDefault();
     try {
       setSaving(true);

       // Find selected class to get default capacity
       const selectedClass = classes.find(c => c._id === formData.class_id);
       const defaultCapacity = selectedClass?.default_capacity || 0;

       // Build datetime strings: "2026-02-05T00:00:00.000+00:00"
       const startAt = formData.start_at ? `${formData.start_at}:00.000+00:00` : null;
       const endAt = formData.end_at ? `${formData.end_at}:00.000+00:00` : null;

       // Capacity: if empty or 0, use class default
       const capacity = formData.capacity && Number(formData.capacity) > 0
         ? Number(formData.capacity)
         : defaultCapacity;

       const payload = {
         class_id: formData.class_id,
         start_at: startAt,
         end_at: endAt,
         capacity: capacity,
         trainer_id: formData.trainer_id ? formData.trainer_id : null,
         location: formData.location ? formData.location : null,
         notes: formData.notes ? formData.notes : null
       };


       await api.post("/class-schedule", payload);
       setShowAddModal(false);
       setFormData({
         class_id: "",
         start_at: "",
         end_at: "",
         capacity: "",
         trainer_id: "",
         location: "",
         notes: ""
       });
       success("Schedule created successfully");
       fetchSchedules();
     } catch (err) {
       console.error("Error creating schedule:", err);
       error(err.response?.data?.message || "Failed to create schedule");
     } finally {
       setSaving(false);
     }
   };

  const handleViewDetails = async (schedule) => {
    setSelectedSchedule(schedule);
    setShowDetailModal(true);
    setBookingTab("joined");
    setLoadingBookings(true);
    
    try {
      const [joinedRes, cancelledRes] = await Promise.all([
        api.get(`/admin/bookings?schedule_id=${schedule._id}&status=joined&limit=100`),
        api.get(`/admin/bookings?schedule_id=${schedule._id}&status=cancelled&limit=100`)
      ]);
      
      setBookings({
        joined: joinedRes.data.data || joinedRes.data.result || [],
        cancelled: cancelledRes.data.data || cancelledRes.data.result || []
      });
    } catch (err) {
      console.error("Error fetching bookings:", err);
    } finally {
      setLoadingBookings(false);
    }
  };

    const handleEdit = (schedule) => {
      setEditingSchedule(schedule);
      // Convert ISO datetime to datetime-local format (YYYY-MM-DDTHH:MM)
      const startAt = schedule.start_at ? schedule.start_at.slice(0, 16) : "";
      const endAt = schedule.end_at ? schedule.end_at.slice(0, 16) : "";

      // Normalize ID helper: handle MongoDB ObjectId wrapper { $oid: "..." }
      const normalizeId = (id) => {
        if (!id) return "";
        if (typeof id === 'object' && id.$oid) return id.$oid;
        return String(id);
      };

      // Get the class ID from the schedule and normalize
      const rawClassId = schedule.class?.class_id || schedule.class_id || "";
      const classId = normalizeId(rawClassId);

      // Find the class in the already-fetched classes to get default_capacity
      const selectedClass = classes.find(c => c._id === classId);
      const classDefaultCapacity = selectedClass?.default_capacity || 0;

      // Use schedule capacity if > 0, otherwise use class default
      const displayCapacity = schedule.capacity && schedule.capacity > 0
        ? schedule.capacity.toString()
        : classDefaultCapacity.toString();

      // Get trainer ID and normalize
      const rawTrainerId = schedule.trainer?.trainer_id || schedule.trainer_id || "";
      const trainerId = normalizeId(rawTrainerId);

      setFormData({
        class_id: classId,
        start_at: startAt,
        end_at: endAt,
        capacity: displayCapacity,
        trainer_id: trainerId,
        location: schedule.location || "",
        notes: schedule.notes || ""
      });
      setShowEditModal(true);
    };

   const handleUpdate = async (e) => {
     e.preventDefault();
     try {
       setSaving(true);

       const startAt = formData.start_at ? `${formData.start_at}:00.000+00:00` : null;
       const endAt = formData.end_at ? `${formData.end_at}:00.000+00:00` : null;

       // Find selected class to get default capacity
       const selectedClass = classes.find(c => c._id === formData.class_id);
       const defaultCapacity = selectedClass?.default_capacity || 0;

       // Build payload with explicit null for empty optional fields
       const payload = {
         class_id: formData.class_id,
         start_at: startAt,
         end_at: endAt,
         trainer_id: formData.trainer_id ? formData.trainer_id : null,
         location: formData.location ? formData.location : null,
         notes: formData.notes ? formData.notes : null
       };
       

       // Only include capacity if user provided a value (non-empty)
       if (formData.capacity && Number(formData.capacity) > 0) {
         payload.capacity = Number(formData.capacity);
       }

       await api.put(`/class-schedule/${editingSchedule._id}`, payload);
       setShowEditModal(false);
       setEditingSchedule(null);
       setFormData({
         class_id: "",
         start_at: "",
         end_at: "",
         capacity: "",
         trainer_id: "",
         location: "",
         notes: ""
       });
       success("Schedule updated successfully");
       fetchSchedules();
     } catch (err) {
       console.error("Error updating schedule:", err);
       error(err.response?.data?.message || "Failed to update schedule");
     } finally {
       setSaving(false);
     }
   };

   const handleCancel = async () => {
     if (!cancellingSchedule) return;
     try {
       setSaving(true);
       await api.patch(`/class-schedule/${cancellingSchedule._id}`, { status: "cancelled" });
       success("Schedule cancelled successfully");
       setShowCancelModal(false);
       setCancellingSchedule(null);
       fetchSchedules();
     } catch (err) {
       console.error("Error cancelling schedule:", err);
       error(err.response?.data?.message || "Failed to cancel schedule");
     } finally {
       setSaving(false);
     }
   };

   const handleArchive = async (schedule) => {
     try {
       await api.patch(`/class-schedule/${schedule._id}`, { status: "archived" });
       success("Schedule archived successfully");
       fetchSchedules();
     } catch (err) {
       console.error("Error archiving schedule:", err);
       error(err.response?.data?.message || "Failed to archive schedule");
     }
   };

   const handleToggleStatus = async (schedule) => {
     // Only toggle between open and closed (not cancelled or archived)
     if (schedule.status === "cancelled" || schedule.status === "archived") {
       error("Cannot toggle cancelled or archived schedules.");
       return;
     }
     try {
       const newStatus = schedule.status === "open" ? "closed" : "open";
       await api.patch(`/class-schedule/${schedule._id}`, { status: newStatus });
       success(`Schedule marked as ${newStatus} successfully`);
       fetchSchedules();
     } catch (err) {
       console.error("Error updating schedule status:", err);
       error(err.response?.data?.message || "Failed to update schedule status");
     }
   };

   const formatDateTime = (dateTime) => {
     if (!dateTime) return "N/A";
     const date = new Date(dateTime);
     return date.toLocaleDateString("en-US", {
       year: "numeric",
       month: "short",
       day: "numeric",
       hour: "2-digit",
       minute: "2-digit",
       hour12: true
     });
   };
  const formatTime = (time) => {
    if (!time) return "N/A";
    return time;
  };

  const getStatusBadge = (status) => {
  switch (status?.toLowerCase()) {
    case "open":
      return "bg-gradient-to-r from-green-500 to-green-700 text-white shadow-md";
    case "closed":
      return "bg-gradient-to-r from-red-500 to-red-700 text-white shadow-md";
    case "cancelled":
      return "bg-gradient-to-r from-yellow-400 to-yellow-600 text-white shadow-md";
    case "archived":
      return "bg-gradient-to-r from-slate-500 to-slate-700 text-white shadow-md";
    default:
      return "bg-slate-600 text-white shadow-md";
  }
};

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Schedules</h1>
          <p className="text-slate-400 mt-1">Manage class schedules</p>
        </div>
        <button
          onClick={() => {
            fetchClasses();
            fetchTrainers();
            setFormData({
              class_id: "",
              start_at: "",
              end_at: "",
              capacity: "",
              trainer_id: "",
              location: "",
              notes: ""
            });
            setShowAddModal(true);
          }}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
        >
          <Plus className="w-5 h-5" />
          New Schedule
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by class name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all duration-200"
          />
        </div>
        <select
          value={classFilter}
          onChange={(e) => {
            setClassFilter(e.target.value);
            setPagination(prev => ({ ...prev, page: 1 }));
          }}
          className="px-4 py-2.5 bg-slate-800/80 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all duration-200 cursor-pointer"
        >
          <option value="">All Classes</option>
          {classes.map((cls) => (
            <option key={cls._id} value={cls._id}>
              {cls.name}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPagination(prev => ({ ...prev, page: 1 }));
          }}
          className="px-4 py-2.5 bg-slate-800/80 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all duration-200 cursor-pointer"
        >
          <option value="">All Status</option>
          <option value="open">Open</option>
          <option value="closed">Closed</option>
          <option value="cancelled">Cancelled</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Date & Time Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label className="block text-xs font-medium text-slate-300 mb-1.5">Start Date</label>
          <input
            type="date"
            value={startDateFilter}
            onChange={(e) => {
              setStartDateFilter(e.target.value);
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all duration-200 [color-scheme:dark]"
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs font-medium text-slate-300 mb-1.5">Start Time</label>
          <input
            type="time"
            value={startTimeFilter}
            onChange={(e) => {
              setStartTimeFilter(e.target.value);
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all duration-200 [color-scheme:dark]"
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs font-medium text-slate-300 mb-1.5">End Date</label>
          <input
            type="date"
            value={endDateFilter}
            onChange={(e) => {
              setEndDateFilter(e.target.value);
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all duration-200 [color-scheme:dark]"
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs font-medium text-slate-300 mb-1.5">End Time</label>
          <input
            type="time"
            value={endTimeFilter}
            onChange={(e) => {
              setEndTimeFilter(e.target.value);
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all duration-200 [color-scheme:dark]"
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs font-medium text-slate-300 mb-1.5">Trainer</label>
          <select
            value={trainerFilter}
            onChange={(e) => {
              setTrainerFilter(e.target.value);
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all duration-200 cursor-pointer"
          >
            <option value="">All Trainers</option>
            {trainers.map((trainer) => (
              <option key={trainer._id} value={trainer._id}>
                {trainer.first_name} {trainer.last_name}
              </option>
            ))}
          </select>
        </div>
        {(classFilter || trainerFilter || statusFilter || startDateFilter || endDateFilter || startTimeFilter || endTimeFilter) && (
          <div className="flex items-end">
            <button
              onClick={() => {
                setClassFilter("");
                setTrainerFilter("");
                setStatusFilter("");
                setStartDateFilter("");
                setEndDateFilter("");
                setStartTimeFilter("");
                setEndTimeFilter("");
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white rounded-lg font-medium transition-all duration-200 shadow-lg shadow-red-600/20"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="fluid-card bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/10 shadow-xl shadow-black/20">
        <div className="table-wrapper overflow-auto">
          <table className="w-full min-w-full table-sticky-header table-row-animated">
            <thead className="bg-slate-700/50">
              <tr>
                <th className="px-2 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Class</th>
                <th className="px-2 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider hidden md:table-cell">Trainer</th>
                <th className="px-2 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider hidden lg:table-cell">Start</th>
                <th className="px-2 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider hidden lg:table-cell">End</th>
                <th className="px-2 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Cap</th>
                <th className="px-2 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-2 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Loading schedules...
                    </div>
                  </td>
                </tr>
              ) : schedules.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-slate-400">
                    No schedules found
                  </td>
                </tr>
              ) : (
                schedules.map((schedule) => (
                  <motion.tr
                    key={schedule._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-slate-700/30"
                  >
                    <td className="px-2 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <div className="text-sm font-medium text-white">
                          {schedule.class?.name || schedule.className || "N/A"}
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-4 whitespace-nowrap hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-400" />
                        <div className="text-sm text-white">
                          {schedule.trainer?.first_name || "N/A"} {schedule.trainer?.last_name || ""}
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-4 whitespace-nowrap hidden lg:table-cell">
                      <div className="flex items-center gap-1 text-sm text-white">
                        <Clock className="w-4 h-4 text-slate-400" />
                        {formatDateTime(schedule.start_at)}
                      </div>
                    </td>
                    <td className="px-2 py-4 whitespace-nowrap hidden lg:table-cell">
                      <div className="text-sm text-white">
                        {formatDateTime(schedule.end_at)}
                      </div>
                    </td>
                    <td className="px-2 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">
                        {schedule.joined_count || 0}/{schedule.capacity || 0}
                      </div>
                    </td>
                     <td className="px-2 py-4 whitespace-nowrap">
                       <button
                         onClick={() => handleToggleStatus(schedule)}
                         disabled={schedule.status === "cancelled" || schedule.status === "archived"}
                         className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${
                           schedule.status === "open" 
                             ? "bg-gradient-to-r from-green-500/20 to-green-700/20 text-green-400 border border-green-500/30"
                             : schedule.status === "closed"
                             ? "bg-gradient-to-r from-red-500/20 to-red-700/20 text-red-400 border border-red-500/30"
                             : schedule.status === "cancelled"
                             ? "bg-gradient-to-r from-yellow-400/20 to-yellow-600/20 text-yellow-400 border border-yellow-500/30 cursor-not-allowed opacity-60"
                             : "bg-gradient-to-r from-slate-500/20 to-slate-700/20 text-slate-400 border border-slate-500/30 cursor-not-allowed opacity-60"
                         }`}
                       >
                         {schedule.status === "open" ? (
                           <><ToggleRight className="w-4 h-4" /> Open</>
                         ) : schedule.status === "closed" ? (
                           <><ToggleLeft className="w-4 h-4" /> Closed</>
                         ) : schedule.status === "cancelled" ? (
                           <><XCircle className="w-4 h-4" /> Cancelled</>
                         ) : (
                           <><Archive className="w-4 h-4" /> Archived</>
                         )}
                       </button>
                     </td>
                     <td className="px-2 py-4 whitespace-nowrap">
                       <div className="flex items-center gap-1">
                         <button
                           onClick={() => handleViewDetails(schedule)}
                           className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition"
                           title="View Details"
                         >
                           <Eye className="w-4 h-4" />
                         </button>
                         <button
                           onClick={() => handleEdit(schedule)}
                           className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition"
                           title="Edit"
                         >
                           <Edit className="w-4 h-4" />
                         </button>
                         {/* Cancel button with confirmation modal */}
                         {(schedule.status === "open" || schedule.status === "closed") && (
                           <button
                             onClick={() => {
                               setCancellingSchedule(schedule);
                               setShowCancelModal(true);
                             }}
                             className="p-2 text-yellow-400 hover:bg-yellow-900/30 hover:text-yellow-300 rounded-lg transition"
                             title="Cancel Schedule"
                           >
                             <XCircle className="w-4 h-4" />
                           </button>
                         )}
                         {schedule.status !== "archived" && (
                           <button
                             onClick={() => handleArchive(schedule)}
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
          <div className="px-3 sm:px-6 py-4 border-t border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs sm:text-sm text-slate-400 text-center sm:text-left">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} schedules
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

      {/* Add Schedule Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-md sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6 border-b border-slate-700 flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-bold text-white">Create Schedule</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Class</label>
                <select
                  value={formData.class_id}
                  onChange={(e) => setFormData({...formData, class_id: e.target.value})}
                  required
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                >
                  <option value="">Select class</option>
                  {classes.map((cls) => (
                    <option key={cls._id} value={cls._id}>
                      {cls.name} {cls.default_capacity ? `(Capacity: ${cls.default_capacity})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Start Date & Time</label>
                <input
                  type="datetime-local"
                  value={formData.start_at}
                  onChange={(e) => setFormData({...formData, start_at: e.target.value})}
                  required
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500 [color-scheme:dark]"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">End Date & Time</label>
                <input
                  type="datetime-local"
                  value={formData.end_at}
                  onChange={(e) => setFormData({...formData, end_at: e.target.value})}
                  required
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500 [color-scheme:dark]"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  Capacity (Optional)
                  <span className="text-xs text-slate-500 block">Uses class default if left empty</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.capacity}
                  onChange={(e) => setFormData({...formData, capacity: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                  placeholder="Leave empty for class default"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Trainer (Optional)</label>
                <select
                  value={formData.trainer_id}
                  onChange={(e) => setFormData({...formData, trainer_id: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                >
                  <option value="">No trainer</option>
                  {trainers.map((trainer) => (
                    <option key={trainer._id} value={trainer._id}>
                      {trainer.first_name} {trainer.last_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                  placeholder="e.g., Room 101"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                  placeholder="Additional notes..."
                  rows={2}
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
                  {saving ? "Creating..." : "Create Schedule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Schedule Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-md sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6 border-b border-slate-700 flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-bold text-white">Edit Schedule</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Class</label>
                <select
                  value={formData.class_id}
                  onChange={(e) => setFormData({...formData, class_id: e.target.value})}
                  required
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                >
                  <option value="">Select class</option>
                  {classes.map((cls) => (
                    <option key={cls._id} value={cls._id}>
                      {cls.name} {cls.default_capacity ? `(Capacity: ${cls.default_capacity})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Start Date & Time</label>
                <input
                  type="datetime-local"
                  value={formData.start_at}
                  onChange={(e) => setFormData({...formData, start_at: e.target.value})}
                  required
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500 [color-scheme:dark]"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">End Date & Time</label>
                <input
                  type="datetime-local"
                  value={formData.end_at}
                  onChange={(e) => setFormData({...formData, end_at: e.target.value})}
                  required
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500 [color-scheme:dark]"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  Capacity (Optional)
                  <span className="text-xs text-slate-500 block">Uses class default if left empty</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.capacity}
                  onChange={(e) => setFormData({...formData, capacity: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                  placeholder="Leave empty for class default"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Trainer (Optional)</label>
                <select
                  value={formData.trainer_id}
                  onChange={(e) => setFormData({...formData, trainer_id: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                >
                  <option value="">No trainer</option>
                  {trainers.map((trainer) => (
                    <option key={trainer._id} value={trainer._id}>
                      {trainer.first_name} {trainer.last_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                  placeholder="e.g., Room 101"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                  placeholder="Additional notes..."
                  rows={2}
                />
               </div>
               <div className="flex justify-end gap-3 pt-4">
                 <button
                   type="button"
                   onClick={() => {
                     setShowEditModal(false);
                     setEditingSchedule(null);
                     setFormData({
                       class_id: "",
                       start_at: "",
                       end_at: "",
                       capacity: "",
                       trainer_id: "",
                       location: "",
                       notes: ""
                     });
                   }}
                   className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
                 >
                   Cancel
                 </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition disabled:opacity-50"
                >
                  {saving ? "Updating..." : "Update Schedule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedSchedule && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-md sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6 border-b border-slate-700 flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-bold text-white">Schedule Details</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* Class Info */}
              <div className="bg-slate-700/50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-slate-400 mb-2">Class Information</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-slate-400">Class Name</p>
                    <p className="text-white">{selectedSchedule.class?.name || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Trainer</p>
                    <p className="text-white">{selectedSchedule.trainer?.first_name || "N/A"} {selectedSchedule.trainer?.last_name || ""}</p>
                  </div>
                </div>
              </div>

              {/* Schedule Info */}
              <div className="bg-slate-700/50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-slate-400 mb-2">Schedule Information</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-slate-400">Start Date & Time</p>
                    <p className="text-white">{formatDateTime(selectedSchedule.start_at)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">End Date & Time</p>
                    <p className="text-white">{formatDateTime(selectedSchedule.end_at)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Location</p>
                    <p className="text-white">{selectedSchedule.location || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Joined / Available Slots</p>
                    <p className="text-white">{selectedSchedule.joined_count || 0} / {selectedSchedule.available_slots || selectedSchedule.capacity || 0}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-slate-400">Notes</p>
                    <p className="text-white">{selectedSchedule.notes || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Status</p>
                    <span
                  className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${getStatusBadge(selectedSchedule.status)}`}
                >
                  {selectedSchedule.status?.charAt(0).toUpperCase() + selectedSchedule.status?.slice(1)}
                </span>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Created At</p>
                    <p className="text-white">{formatDateTime(selectedSchedule.createdAt)}</p>
                  </div>
                </div>
              </div>

              {/* Bookings Section */}
              <div className="bg-slate-700/50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-slate-400 mb-2">Client Bookings</h3>
                <div className="flex gap-2 mb-3">
                  <button
                    onClick={() => setBookingTab("joined")}
                    className={`px-3 py-1.5 text-sm rounded-lg transition ${
                      bookingTab === "joined"
                        ? "bg-green-600 text-white"
                        : "bg-slate-600 text-slate-300 hover:bg-slate-500"
                    }`}
                  >
                    Joined ({bookings.joined.length})
                  </button>
                  <button
                    onClick={() => setBookingTab("cancelled")}
                    className={`px-3 py-1.5 text-sm rounded-lg transition ${
                      bookingTab === "cancelled"
                        ? "bg-red-600 text-white"
                        : "bg-slate-600 text-slate-300 hover:bg-slate-500"
                    }`}
                  >
                    Cancelled ({bookings.cancelled.length})
                  </button>
                </div>
                
                {loadingBookings ? (
                  <div className="flex items-center justify-center py-4 text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                    Loading...
                  </div>
                ) : (
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {(bookingTab === "joined" ? bookings.joined : bookings.cancelled).length === 0 ? (
                      <p className="text-sm text-slate-400 text-center py-2">
                        No {bookingTab} clients
                      </p>
                    ) : (
                      (bookingTab === "joined" ? bookings.joined : bookings.cancelled).map((booking) => (
                        <div
                          key={booking._id}
                          className="flex items-center justify-between p-2 bg-slate-600/50 rounded-lg"
                        >
                          <div>
                            <p className="text-sm text-white">
                              {booking.client?.first_name} {booking.client?.last_name}
                            </p>
                            <p className="text-xs text-slate-400">{booking.client?.email}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-slate-400">
                              {bookingTab === "cancelled" && booking.cancelledAt
                                ? formatDateTime(booking.cancelledAt)
                                : booking.joinedAt
                                ? formatDateTime(booking.joinedAt)
                                : ""}
                            </p>
                            {bookingTab === "cancelled" && booking.cancelReason && (
                              <p className="text-xs text-red-400">{booking.cancelReason}</p>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
       {/* Cancel Confirmation Modal */}
       {showCancelModal && cancellingSchedule && (
         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
           <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-md">
             <div className="p-6 border-b border-slate-700">
               <h2 className="text-xl font-bold text-white">Confirm Cancellation</h2>
               <p className="text-slate-300 mt-2">
                 Are you sure you want to cancel the schedule for <span className="font-semibold text-white">{cancellingSchedule.class?.name || cancellingSchedule.className || "this class"}</span>?
                 <br />
                 <span className="text-yellow-400 text-sm">This action cannot be undone.</span>
               </p>
             </div>
             <div className="p-6 flex justify-end gap-3">
               <button
                 onClick={() => {
                   setShowCancelModal(false);
                   setCancellingSchedule(null);
                 }}
                 className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
               >
                 No, Keep It
               </button>
               <button
                 onClick={handleCancel}
                 disabled={saving}
                 className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition disabled:opacity-50"
               >
                 {saving ? "Cancelling..." : "Yes, Cancel"}
               </button>
             </div>
           </div>
         </div>
       )}

     </div>
   );
 }
