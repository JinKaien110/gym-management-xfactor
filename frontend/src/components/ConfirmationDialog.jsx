import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, AlertCircle, HelpCircle, X, CheckCircle } from "lucide-react";

export default function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  type = "warning", // warning, danger, info, success
  confirmText = "Confirm",
  cancelText = "Cancel",
  loading = false,
  showInput = false,
  inputValue = "",
  onInputChange,
  inputPlaceholder = "Type to confirm",
}) {
  const icons = {
    warning: AlertTriangle,
    danger: AlertCircle,
    info: HelpCircle,
    success: CheckCircle,
  };

  const colors = {
    warning: {
      bg: "bg-yellow-600/20",
      border: "border-yellow-500/50",
      icon: "text-yellow-500",
      button: "bg-yellow-600 hover:bg-yellow-500",
    },
    danger: {
      bg: "bg-red-600/20",
      border: "border-red-500/50",
      icon: "text-red-500",
      button: "bg-red-600 hover:bg-red-500",
    },
    info: {
      bg: "bg-blue-600/20",
      border: "border-blue-500/50",
      icon: "text-blue-500",
      button: "bg-blue-600 hover:bg-blue-500",
    },
    success: {
      bg: "bg-green-600/20",
      border: "border-green-500/50",
      icon: "text-green-500",
      button: "bg-green-600 hover:bg-green-500",
    },
  };

  const Icon = icons[type];
  const style = colors[type];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
            onClick={!loading ? onClose : undefined}
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md bg-slate-800/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Content */}
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-full ${style.bg} border ${style.border}`}>
                  <Icon className={`w-6 h-6 ${style.icon}`} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
                  <p className="text-slate-300">{message}</p>
                </div>
              </div>

              {/* Input for confirmation */}
              {showInput && (
                <div className="mt-4">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={onInputChange}
                    placeholder={inputPlaceholder}
                    className="w-full px-4 py-2.5 bg-slate-700/50 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                    autoFocus
                  />
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="px-6 py-4 bg-slate-900/50 border-t border-white/5 flex items-center justify-end gap-3">
              <button
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 bg-slate-700/60 hover:bg-slate-600/80 text-white rounded-lg font-medium transition-all border border-white/10 disabled:opacity-50"
              >
                {cancelText}
              </button>
              <motion.button
                onClick={onConfirm}
                disabled={loading || (showInput && inputValue !== "confirm")}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`px-4 py-2 ${style.button} text-white rounded-lg font-medium transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
              >
                {loading && (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                {confirmText}
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
