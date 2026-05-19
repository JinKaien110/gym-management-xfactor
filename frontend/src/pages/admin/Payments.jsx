import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  DollarSign, 
  Search, 
  RefreshCw,
  Eye
} from "lucide-react";
import api from "../../api/axios.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useNotification } from "../../context/NotificationContext.jsx";

export default function Payments() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { success, error } = useNotification();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/admin/login");
    }
  }, [isAuthenticated, navigate]);

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("");
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [totalRevenue, setTotalRevenue] = useState(0);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append("page", pagination.page);
      params.append("limit", pagination.limit);
      if (search) params.append("search", search);
      if (statusFilter) params.append("status", statusFilter);
      if (paymentMethodFilter) params.append("payment_method", paymentMethodFilter);
      if (startDateFilter) params.append("start_date", startDateFilter);
      if (endDateFilter) params.append("end_date", endDateFilter);

      const response = await api.get(`/admin/payments?${params.toString()}`);
      console.log("Payments response:", response.data);
      setPayments(response.data.result || response.data.data || []);
      setPagination(prev => ({
        ...prev,
        total: response.data.total || 0,
        totalPages: response.data.totalPages || response.data.pages || 0
      }));
    } catch (err) {
      console.error("Error fetching payments:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTotalRevenue = async () => {
    try {
      const response = await api.get("/admin/payments/total-revenue");
      setTotalRevenue(response.data.totalRevenue || 0);
    } catch (err) {
      console.error("Error fetching total revenue:", err);
    }
  };

  useEffect(() => {
    fetchPayments();
    fetchTotalRevenue();
  }, [pagination.page, search, statusFilter, paymentMethodFilter, startDateFilter, endDateFilter]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }));
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
    switch (status?.toUpperCase()) {
      case "PAID":
        return "bg-green-600/20 text-green-400";
        
      case "PENDING":
        return "bg-yellow-600/20 text-yellow-400";
      case "FAILED":
      case "EXPIRED":
        return "bg-red-600/20 text-red-400";
      default:
        return "bg-slate-600/20 text-slate-400";
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Payments</h1>
          <p className="text-slate-400 mt-1">Manage and view payment transactions</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-green-600/20 px-4 py-2 rounded-lg">
            <span className="text-green-400 font-medium">Total Revenue: </span>
            <span className="text-white font-bold">₱{totalRevenue.toLocaleString()}</span>
          </div>
        </div>
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
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800/60 backdrop-blur-sm border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/50 transition-all duration-200 shadow-inner"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPagination(prev => ({ ...prev, page: 1 }));
          }}
          className="px-4 py-2.5 bg-slate-800/80 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all duration-200 cursor-pointer"
        >
          <option value="">All Status</option>
          <option value="PAID">Paid</option>
          <option value="PENDING">Pending</option>
          <option value="FAILED">Failed</option>
        </select>
        <select
          value={paymentMethodFilter}
          onChange={(e) => {
            setPaymentMethodFilter(e.target.value);
            setPagination(prev => ({ ...prev, page: 1 }));
          }}
          className="px-4 py-2.5 bg-slate-800/80 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all duration-200 cursor-pointer"
        >
          <option value="">All Methods</option>
          <option value="cash">Cash</option>
          <option value="gcash">GCash</option>
          <option value="paymaya">PayMaya</option>
        </select>
      </div>

      {/* Date Filters */}
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
        {(paymentMethodFilter || startDateFilter || endDateFilter) && (
          <div className="flex items-end">
            <button
              onClick={() => {
                setPaymentMethodFilter("");
                setStartDateFilter("");
                setEndDateFilter("");
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
          <table className="w-full table-sticky-header table-row-animated">
            <thead className="bg-slate-700/50">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">client</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Amount</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Payment Method</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider hidden sm:table-cell">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Loading payments...
                    </div>
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-slate-400">
                    No payments found
                  </td>
                </tr>
              ) : (
                payments.map((payment) => (
                  <motion.tr
                    key={payment._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-slate-700/30"
                  >
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-600 flex items-center justify-center text-white font-medium text-sm">
                          {(payment.first_name || payment.client?.first_name)?.charAt(0) || "M"}{(payment.last_name || payment.client?.last_name)?.charAt(0) || ""}
                        </div>
                        <div className="ml-2 sm:ml-4">
                          <div className="text-sm font-medium text-white">
                            {payment.first_name || payment.client?.first_name} {payment.last_name || payment.client?.last_name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-green-400">₱{payment.amount?.toLocaleString() || "0"}</div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white capitalize">{payment.payment_method || "N/A"}</div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(payment.status)}`}>
                        {payment.status || "N/A"}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-slate-400 hidden sm:table-cell">
                      {formatDate(payment.date || payment.createdAt)}
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
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} payments
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
    </div>
  );
}
