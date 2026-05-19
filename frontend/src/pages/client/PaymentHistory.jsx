// pages/client/PaymentHistory.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  DollarSign, 
  Calendar, 
  CreditCard, 
  Clock,
  ChevronLeft,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  ChevronRight
} from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useNotification } from "../../context/NotificationContext.jsx";
import api from "../../api/axios.js";

export default function PaymentHistory() {
  const { user, isAuthenticated } = useAuth();
  const { error } = useNotification();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1 });

  // Helper to format payment method
  const formatPaymentMethod = (method) => {
    if (!method) return "N/A";
    const methodLower = method.toLowerCase();
    if (methodLower === "gcash") return "GCash";
    if (methodLower === "paymaya" || methodLower === "maya") return "PayMaya";
    if (methodLower === "cash") return "Cash";
    return method.charAt(0).toUpperCase() + method.slice(1);
  };

  const downloadReceipt = async (payment) => {
    try {
    
      const response = await api.get(`/client/payments/${payment._id}/receipt`, {
        responseType: 'blob'
      });

      if (response.status !== 200) throw new Error('Failed to download');                       
      const blob = response.data;
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `receipt-${payment._id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading receipt:', err);
      error('Failed to download receipt');
    }
  }
  // Fetch payment data from API
  useEffect(() => {
    async function fetchPayments() {
      try {
        const params = new URLSearchParams();
        params.append("page", pagination.page);
        params.append("limit", pagination.limit);

        const response = await api.get(`/client/payments?${params.toString()}`);
        console.log("API Response:", response.data); // Debug log for API response structure
        // Update pagination info from response
        if (response.data.totalPages) {
          setPagination(prev => ({ ...prev, totalPages: response.data.totalPages }));
        }

        // Transform API data to match component structure
        // API returns { result: [...], total, page, limit, totalPages }
        const paymentsArray = response.data.result || response.data.data || [];
        
        // Helper to format payment_for to readable English
        const formatPaymentFor = (value) => {
          if (!value) return "Payment";
          const formatMap = {
            "daily_pass": "Daily Pass",
            "client_pass": "Client Pass",
            "membership": "Membership",
            "registration": "Registration Fee",
            "freeze": "Freeze Fee",
            "extension": "Extension Fee"
          };
          const lower = value.toLowerCase();
          return formatMap[lower] || value.charAt(0).toUpperCase() + value.slice(1).replace(/_/g, " ");
        };

        const transformedPayments = paymentsArray.map(payment => ({
          _id: payment._id,
          date: payment.date ? new Date(payment.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
          description: formatPaymentFor(payment.payment_for) || formatPaymentFor(payment.type) || "Payment",
          amount: payment.amount || 0,
          status: payment.status?.toUpperCase() || "PENDING",
          payment_method: payment.payment_method || "N/A",
          payment_id: payment.reference_no || null
        }));

        setPayments(transformedPayments);
      } catch (err) {
        console.error("Error fetching payments:", err);
        error(err.response?.data?.message || "Failed to load payment history");
      } finally {
        setLoading(false);
      }
    }

    if (isAuthenticated) {
      fetchPayments();
    }
  }, [isAuthenticated, pagination.page, pagination.limit]);

  const getStatusIcon = (status) => {
    switch (status) {
      case "PAID":
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case "PENDING":
        return <AlertCircle className="w-4 h-4 text-yellow-400" />;
      case "FAILED":
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "PAID":
        return "bg-green-500/20 text-green-400";
      case "PENDING":
        return "bg-yellow-500/20 text-yellow-400";
      case "FAILED":
        return "bg-red-500/20 text-red-400";
      default:
        return "bg-slate-500/20 text-slate-400";
    }
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (payment.payment_id && payment.payment_id.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesFilter = filterStatus === "all" || payment.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const totalPaid = payments
    .filter(p => p.status === "PAID")
    .reduce((sum, p) => sum + p.amount, 0);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-400">Please log in to view your payment history.</p>
          <Link to="/login" className="text-red-400 hover:text-red-300 mt-2 inline-block">
            Log In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
        >
          {/* Total Spent */}
          <div className="p-6 rounded-2xl bg-slate-800/40 backdrop-blur-xl border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-amber-400" />
              </div>
            </div>
            <p className="text-slate-400 text-sm mb-1">Total Spent</p>
            <p className="text-2xl font-bold text-white">₱{totalPaid.toLocaleString()}</p>
          </div>

          {/* Total Transactions */}
          <div className="p-6 rounded-2xl bg-slate-800/40 backdrop-blur-xl border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-green-400" />
              </div>
            </div>
            <p className="text-slate-400 text-sm mb-1">Total Transactions</p>
            <p className="text-2xl font-bold text-white">{payments.length}</p>
          </div>

          {/* Pending Payments */}
          <div className="p-6 rounded-2xl bg-slate-800/40 backdrop-blur-xl border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-400" />
              </div>
            </div>
            <p className="text-slate-400 text-sm mb-1">Pending Payments</p>
            <p className="text-2xl font-bold text-white">
              {payments.filter(p => p.status === "PENDING").length}
            </p>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex flex-col md:flex-row gap-4 mb-6"
        >
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by description or transaction ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800/40 backdrop-blur-xl border border-white/10 text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full md:w-48 pl-10 pr-4 py-3 rounded-xl bg-slate-800/40 backdrop-blur-xl border border-white/10 text-white focus:outline-none focus:border-amber-500 appearance-none cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="PAID">Paid</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>
        </motion.div>

        {/* Payment List */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="rounded-2xl bg-slate-800/40 backdrop-blur-xl border border-white/10 overflow-hidden"
        >
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-600"></div>
            </div>
          ) : filteredPayments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-slate-400 text-sm border-b border-white/5">
                    <th className="px-6 py-4 font-medium">Date</th>
                    <th className="px-6 py-4 font-medium">Payment For</th>
                    <th className="px-6 py-4 font-medium">Amount</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Method</th>
                    <th className="px-6 py-4 font-medium">Payment ID</th>
                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((payment, index) => (
                    <motion.tr
                      key={payment._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-white/5 hover:bg-white/5 transition"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2 text-slate-300">
                          <Calendar className="w-4 h-4 text-slate-500" />
                          <span>{payment.date}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-white font-medium">{payment.description}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-white font-semibold">₱{payment.amount.toLocaleString()}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                          {getStatusIcon(payment.status)}
                          <span>{payment.status}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-slate-400 text-sm">{payment.payment_method}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-slate-500 text-sm font-mono">{payment.payment_id || "—"}</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => downloadReceipt(payment)}
                          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
                          title="Download Receipt"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <DollarSign className="w-12 h-12 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-400">No payments found</p>
            </div>
          )}
        </motion.div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-6 flex items-center justify-between p-4 rounded-xl bg-slate-800/40 border border-white/10"
          >
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page <= 1}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-slate-400 text-sm">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page >= pagination.totalPages}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            <p className="text-slate-400 text-sm">
              Showing {filteredPayments.length} of {payments.length} transactions
            </p>
          </motion.div>
        )}

        {/* Empty State Info */}
        {pagination.totalPages <= 1 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-6 p-4 rounded-xl bg-slate-800/40 border border-white/10"
          >
            <p className="text-slate-400 text-sm text-center">
              Showing {filteredPayments.length} of {payments.length} transactions
            </p>
          </motion.div>
        )}
      </main>
    </div>
  );
}