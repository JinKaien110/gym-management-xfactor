import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Download, FileText, Filter, ChevronLeft, ChevronRight, Search, Calendar, Clock, Activity, Zap, Loader2, AlertCircle } from "lucide-react";
import api from "../../api/axios";

export default function MyWorkoutHistory() {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    sortBy: "createdAt",
    sortOrder: "desc"
  });

  const fetchRecommendations = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(pagination.page),
        limit: String(pagination.limit),
        ...(filters.search && { search: filters.search }),
        ...(filters.status && { status: filters.status }),
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      });
      
      const response = await api.get(`/ai/my-workout-recommendations?${params.toString()}`);
      const data = response.data;
      
      setRecommendations(data.data || []);
      setPagination(prev => ({
        ...prev,
        total: parseInt(data.total) || 0,
        totalPages: parseInt(data.totalPages) || 0
      }));
    } catch (err) {
      console.error("Error fetching recommendations:", err);
      setError(err.response?.data?.message || "Failed to load workout recommendations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [pagination.page, pagination.limit, filters.sortBy, filters.sortOrder]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchRecommendations();
  };

  const handleSort = (column) => {
    setFilters(prev => ({
      ...prev,
      sortBy: column,
      sortOrder: prev.sortBy === column && prev.sortOrder === "desc" ? "asc" : "desc"
    }));
  };

  const handleExport = async (format) => {
    try {
      const params = new URLSearchParams({
        export: format,
        ...(filters.search && { search: filters.search }),
        ...(filters.status && { status: filters.status }),
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      });
      
      const response = await api.get(`/ai/my-workout-recommendations?${params.toString()}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `workout-recommendations.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export error:", err);
    }
  };

  const getIntensityColor = (intensity) => {
    const colors = {
      low: "text-green-400 bg-green-400/10",
      medium: "text-yellow-400 bg-yellow-400/10",
      high: "text-orange-400 bg-orange-400/10",
      extreme: "text-red-400 bg-red-400/10"
    };
    return colors[intensity?.toLowerCase()] || colors.medium;
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "text-yellow-400 bg-yellow-400/10",
      approved: "text-green-400 bg-green-400/10",
      rejected: "text-red-400 bg-red-400/10"
    };
    return colors[status?.toLowerCase()] || colors.pending;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen text-white relative">
      <div className="relative z-10 py-8 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-7xl mx-auto"
        >
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              MY <span className="text-red-500">WORKOUT HISTORY</span>
            </h1>
            <p className="text-gray-400">View your previously requested workout recommendations</p>
          </div>

          {/* Glassmorphism Container */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
            {/* Filters & Actions Bar */}
            <div className="p-4 md:p-6 border-b border-white/10">
              <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
                {/* Search */}
                <form onSubmit={handleSearch} className="flex gap-2 w-full lg:w-auto">
                  <div className="relative flex-1 lg:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search recommendations..."
                      value={filters.search}
                      onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                      className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white font-medium transition-colors"
                  >
                    <Filter className="w-4 h-4" />
                  </button>
                </form>

                {/* Export Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleExport('csv')}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-sm font-medium transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    CSV
                  </button>
                  <button
                    onClick={() => handleExport('pdf')}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-sm font-medium transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    PDF
                  </button>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full" role="table" aria-label="Workout Recommendations">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                      <button 
                        onClick={() => handleSort('createdAt')}
                        className="flex items-center gap-1 hover:text-white"
                        aria-label="Sort by date"
                      >
                        Date
                        {filters.sortBy === 'createdAt' && (
                          <span className="text-red-500">{filters.sortOrder === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Workout Type</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Duration</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                      <button 
                        onClick={() => handleSort('intensity')}
                        className="flex items-center gap-1 hover:text-white"
                        aria-label="Sort by intensity"
                      >
                        Intensity
                        {filters.sortBy === 'intensity' && (
                          <span className="text-red-500">{filters.sortOrder === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Description</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                      <button 
                        onClick={() => handleSort('status')}
                        className="flex items-center gap-1 hover:text-white"
                        aria-label="Sort by status"
                      >
                        Status
                        {filters.sortBy === 'status' && (
                          <span className="text-red-500">{filters.sortOrder === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
                          <span className="text-gray-400">Loading recommendations...</span>
                        </div>
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <AlertCircle className="w-8 h-8 text-red-500" />
                          <span className="text-red-400">{error}</span>
                          <button
                            onClick={fetchRecommendations}
                            className="mt-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium"
                          >
                            Try Again
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : recommendations.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <Activity className="w-12 h-12 text-gray-600" />
                          <span className="text-gray-400">No workout recommendations found</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    recommendations.map((recommendation, index) => (
                      <motion.tr
                        key={recommendation._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-white/5 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-300">{formatDate(recommendation.createdAt)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4 text-red-500" />
                            <span className="text-white font-medium">{recommendation.workout_type || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-300">{recommendation.duration || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getIntensityColor(recommendation.intensity)}`}>
                            {recommendation.intensity || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-gray-400 text-sm line-clamp-2 max-w-xs">
                            {recommendation.description || recommendation.recommendation || 'No description'}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(recommendation.status)}`}>
                            {recommendation.status || 'pending'}
                          </span>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="p-4 md:p-6 border-t border-white/10">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="text-sm text-gray-400">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                      disabled={pagination.page === 1}
                      className="p-2 bg-white/10 hover:bg-white/20 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      aria-label="Previous page"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                        .filter(page => {
                          const total = pagination.totalPages;
                          return page === 1 || page === total || (page >= pagination.page - 1 && page <= pagination.page + 1);
                        })
                        .map((page, index, array) => (
                          <div key={page} className="flex items-center">
                            {index > 0 && array[index - 1] !== page - 1 && (
                              <span className="px-2 text-gray-500">...</span>
                            )}
                            <button
                              onClick={() => setPagination(prev => ({ ...prev, page }))}
                              className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                                pagination.page === page 
                                  ? 'bg-red-600 text-white' 
                                  : 'bg-white/10 hover:bg-white/20 text-gray-300'
                              }`}
                              aria-label={`Page ${page}`}
                              aria-current={pagination.page === page ? 'page' : undefined}
                            >
                              {page}
                            </button>
                          </div>
                        ))}
                    </div>
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                      disabled={pagination.page === pagination.totalPages}
                      className="p-2 bg-white/10 hover:bg-white/20 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      aria-label="Next page"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}