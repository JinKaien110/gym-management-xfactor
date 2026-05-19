// pages/client/Progress.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, 
  ChevronRight,
  Edit,
  Trash2,
  X,
  Clock,
  Dumbbell,
  Calendar,
  FileText,
  CheckCircle
} from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useNotification } from "../../context/NotificationContext.jsx";
import api from "../../api/axios.js";
import Modal from "../../components/Modal.jsx";

const WORKOUT_TYPES = [
  { value: "strength", label: "Strength" },
  { value: "cardio", label: "Cardio" },
  { value: "hiit", label: "HIIT" },
  { value: "flexibility", label: "Flexibility" },
  { value: "sports", label: "Sports" }
];

const COMMON_EXERCISES = [
  "Bench Press", "Squat", "Deadlift", "Pull-ups", "Push-ups",
  "Dumbbell Rows", "Shoulder Press", "Bicep Curls", "Tricep Extensions",
  "Lunges", "Plank", "Crunches", "Leg Press", "Lat Pulldown",
  "Running", "Cycling", "Jump Rope", "Box Jumps", "Burpees"
];

export default function Progress() {
  const { user, isAuthenticated } = useAuth();
  const { success, error } = useNotification();
  const [loading, setLoading] = useState(true);
  const [progressEntries, setProgressEntries] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    workout_type: "strength",
    duration: 30,
    exercises: [],
    exercise_details: [],
    notes: ""
  });

  const [customExercise, setCustomExercise] = useState("");

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    fetchProgressEntries();
  }, [isAuthenticated]);

  const fetchProgressEntries = async () => {
    try {
      setLoading(true);
      const response = await api.get("/client/progress");
      setProgressEntries(response.data.result || []);
    } catch (err) {
      console.error("Error fetching progress:", err);
      // Silently handle - might be first time user
      setProgressEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (entry = null) => {
    if (entry) {
      setEditingEntry(entry);
      setFormData({
        date: entry.date ? entry.date.split("T")[0] : new Date().toISOString().split("T")[0],
        workout_type: entry.workout_type || "strength",
        duration: entry.duration || 30,
        exercises: entry.exercises || [],
        exercise_details: entry.exercise_details || [],
        notes: entry.notes || ""
      });
    } else {
      setEditingEntry(null);
      setFormData({
        date: new Date().toISOString().split("T")[0],
        workout_type: "strength",
        duration: 30,
        exercises: [],
        exercise_details: [],
        notes: ""
      });
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingEntry(null);
    setCustomExercise("");
  };

  const handleAddExercise = () => {
    if (customExercise.trim() && !formData.exercises.includes(customExercise.trim())) {
      const newExercises = [...formData.exercises, customExercise.trim()];
      const newDetails = [...formData.exercise_details, { 
        exercise: customExercise.trim(), 
        sets: 3, 
        reps: 10, 
        weight: 0 
      }];
      setFormData({ 
        ...formData, 
        exercises: newExercises,
        exercise_details: newDetails
      });
      setCustomExercise("");
    }
  };

  const handleExerciseToggle = (exercise) => {
    if (formData.exercises.includes(exercise)) {
      const newExercises = formData.exercises.filter(e => e !== exercise);
      const newDetails = formData.exercise_details.filter(d => d.exercise !== exercise);
      setFormData({ ...formData, exercises: newExercises, exercise_details: newDetails });
    } else {
      const newExercises = [...formData.exercises, exercise];
      const newDetails = [...formData.exercise_details, { exercise, sets: 3, reps: 10, weight: 0 }];
      setFormData({ ...formData, exercises: newExercises, exercise_details: newDetails });
    }
  };

  const handleDetailChange = (exerciseName, field, value) => {
    const newDetails = formData.exercise_details.map(d => 
      d.exercise === exerciseName ? { ...d, [field]: value } : d
    );
    setFormData({ ...formData, exercise_details: newDetails });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        date: formData.date,
        workout_type: formData.workout_type,
        duration: parseInt(formData.duration),
        exercises: formData.exercises,
        exercise_details: formData.exercise_details,
        notes: formData.notes
      };

      if (editingEntry) {
        await api.put(`/client/progress/${editingEntry._id}`, payload);
        success("Progress entry updated successfully!");
      } else {
        await api.post("/client/progress", payload);
        success("Progress entry added successfully!");
      }

      await fetchProgressEntries();
      handleCloseModal();
    } catch (err) {
      console.error("Error saving progress:", err);
      error(err.response?.data?.message || "Failed to save progress entry");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (entryId) => {
    try {
      await api.delete(`/client/progress/${entryId}`);
      success("Progress entry deleted successfully!");
      await fetchProgressEntries();
      setDeleteConfirm(null);
    } catch (err) {
      console.error("Error deleting progress:", err);
      error("Failed to delete progress entry");
    }
  };

  const getWorkoutTypeLabel = (type) => {
    const found = WORKOUT_TYPES.find(t => t.value === type);
    return found ? found.label : type;
  };

  const getExerciseSummary = (entry) => {
    if (!entry.exercise_details || entry.exercise_details.length === 0) {
      return "No exercises logged";
    }
    const summary = entry.exercise_details.slice(0, 3).map(d => d.exercise);
    if (entry.exercise_details.length > 3) {
      return summary.join(", ") + ` +${entry.exercise_details.length - 3} more`;
    }
    return summary.join(", ");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"></div>
      <div className="absolute top-20 left-10 w-72 h-72 bg-red-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-red-600/10 rounded-full blur-3xl"></div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link 
            to="/client/dashboard" 
            className="inline-flex items-center text-slate-400 hover:text-white mb-4 transition"
          >
            <ChevronRight className="w-4 h-4 rotate-180 mr-1" />
            Back to Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">
                WORKOUT <span className="text-red-500">PROGRESS</span>
              </h1>
              <p className="text-slate-400 mt-2">Track and log your workout sessions</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white rounded-xl font-medium transition shadow-lg shadow-red-500/25"
            >
              <Plus className="w-5 h-5" />
              <span>Log Workout</span>
            </motion.button>
          </div>
        </motion.div>

        {/* Progress Entries List */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-red-500" />
            Workout History
          </h2>

          {progressEntries.length > 0 ? (
            <AnimatePresence>
              {progressEntries.map((entry, index) => (
                <motion.div
                  key={entry._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-red-500/30 transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-3 py-1 bg-red-600/20 text-red-400 rounded-full text-sm font-medium">
                          {getWorkoutTypeLabel(entry.workout_type)}
                        </span>
                        <span className="text-slate-400 text-sm flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {entry.duration} min
                        </span>
                        <span className="text-slate-400 text-sm flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {entry.date ? new Date(entry.date).toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' }) : "N/A"}
                        </span>
                      </div>
                      <p className="text-slate-300 text-sm">
                        <span className="font-medium">Exercises:</span> {getExerciseSummary(entry)}
                      </p>
                      {entry.notes && (
                        <p className="text-slate-400 text-sm mt-2 italic">
                          "{entry.notes}"
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenModal(entry)}
                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg transition"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(entry)}
                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg transition"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          ) : (
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-12 border border-white/10 text-center">
              <Dumbbell className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 text-lg mb-2">No workouts logged yet</p>
              <p className="text-slate-500 text-sm mb-6">Start tracking your progress by logging your first workout!</p>
              <button
                onClick={() => handleOpenModal()}
                className="inline-flex items-center gap-2 px-5 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition"
              >
                <Plus className="w-5 h-5" />
                Log Your First Workout
              </button>
            </div>
          )}
        </motion.div>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        title={editingEntry ? "Edit Workout" : "Log Workout"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Date
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-red-500"
              required
            />
          </div>

          {/* Workout Type & Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Workout Type
              </label>
              <select
                value={formData.workout_type}
                onChange={(e) => setFormData({ ...formData, workout_type: e.target.value })}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-red-500"
                required
              >
                {WORKOUT_TYPES.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Duration (minutes)
              </label>
              <input
                type="number"
                min="1"
                max="480"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-red-500"
                required
              />
            </div>
          </div>

          {/* Exercises */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Exercises Performed
            </label>
            
            {/* Quick Select Chips */}
            <div className="flex flex-wrap gap-2 mb-4">
              {COMMON_EXERCISES.slice(0, 10).map(exercise => (
                <button
                  key={exercise}
                  type="button"
                  onClick={() => handleExerciseToggle(exercise)}
                  className={`px-3 py-1.5 rounded-full text-sm transition ${
                    formData.exercises.includes(exercise)
                      ? "bg-red-600 text-white"
                      : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                  }`}
                >
                  {exercise}
                </button>
              ))}
            </div>

            {/* Custom Exercise Input */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={customExercise}
                onChange={(e) => setCustomExercise(e.target.value)}
                placeholder="Add custom exercise..."
                className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-red-500"
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddExercise())}
              />
              <button
                type="button"
                onClick={handleAddExercise}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition"
              >
                Add
              </button>
            </div>

            {/* Selected Exercises */}
            {formData.exercises.length > 0 && (
              <div className="bg-slate-900/50 rounded-xl p-4 space-y-4">
                <p className="text-sm text-slate-400 font-medium">Selected Exercises:</p>
                {formData.exercise_details.map((detail, idx) => (
                  <div key={idx} className="flex items-center gap-4 p-3 bg-slate-800 rounded-lg">
                    <span className="text-white font-medium flex-1">{detail.exercise}</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        value={detail.sets}
                        onChange={(e) => handleDetailChange(detail.exercise, "sets", e.target.value)}
                        className="w-16 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm text-center"
                        placeholder="Sets"
                      />
                      <span className="text-slate-400 text-sm">x</span>
                      <input
                        type="number"
                        min="1"
                        value={detail.reps}
                        onChange={(e) => handleDetailChange(detail.exercise, "reps", e.target.value)}
                        className="w-16 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm text-center"
                        placeholder="Reps"
                      />
                      <span className="text-slate-400 text-sm">@</span>
                      <input
                        type="number"
                        min="0"
                        value={detail.weight}
                        onChange={(e) => handleDetailChange(detail.exercise, "weight", e.target.value)}
                        className="w-20 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm text-center"
                        placeholder="lbs"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Personal Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="How did the workout feel? Any observations..."
              rows={3}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-red-500 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={handleCloseModal}
              className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || formData.exercises.length === 0}
              className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white rounded-xl font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : editingEntry ? "Update Workout" : "Log Workout"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Workout"
        size="sm"
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-8 h-8 text-red-400" />
          </div>
          <p className="text-white mb-2">Are you sure you want to delete this workout?</p>
          <p className="text-slate-400 text-sm mb-6">This action cannot be undone.</p>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => setDeleteConfirm(null)}
              className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition"
            >
              Cancel
            </button>
            <button
              onClick={() => handleDelete(deleteConfirm._id)}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl transition"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
