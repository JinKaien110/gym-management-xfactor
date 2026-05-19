import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react";
import { useNotification } from "../context/NotificationContext.jsx";

export default function Notification() {
  const { notifications, removeNotification } = useNotification();

  const getIcon = (type) => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "error":
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getStyles = (type) => {
    switch (type) {
      case "success":
        return "bg-green-600/90 border-green-400/50 shadow-green-500/20";
      case "error":
        return "bg-red-600/90 border-red-400/50 shadow-red-500/20";
      case "warning":
        return "bg-yellow-600/90 border-yellow-400/50 shadow-yellow-500/20";
      default:
        return "bg-blue-600/90 border-blue-400/50 shadow-blue-500/20";
    }
  };

  const getProgressColor = (type) => {
    switch (type) {
      case "success":
        return "bg-green-400";
      case "error":
        return "bg-red-400";
      case "warning":
        return "bg-yellow-400";
      default:
        return "bg-blue-400";
    }
  };

  // Auto-dismiss notification component
  function AutoDismissNotification({ notification, onDismiss }) {
    const [progress, setProgress] = useState(100);
    const duration = 5000; // 5 seconds

    useEffect(() => {
      const interval = 50;
      const decrement = (interval / duration) * 100;

      const timer = setInterval(() => {
        setProgress((prev) => {
          if (prev <= 0) {
            clearInterval(timer);
            onDismiss();
            return 0;
          }
          return prev - decrement;
        });
      }, interval);

      return () => clearInterval(timer);
    }, [onDismiss]);

    return (
      <motion.div
        key={notification.id}
        initial={{ opacity: 0, x: 50, scale: 0.9, rotate: 2 }}
        animate={{ opacity: 1, x: 0, scale: 1, rotate: 0 }}
        exit={{ opacity: 0, x: 50, scale: 0.9, rotate: -2 }}
        className={`relative flex items-start gap-3 p-4 rounded-xl border ${getStyles(notification.type)} shadow-xl backdrop-blur-md overflow-hidden`}
      >
        {/* Progress bar */}
        <motion.div
          initial={{ width: "100%" }}
          animate={{ width: `${progress}%` }}
          className={`absolute bottom-0 left-0 h-1 ${getProgressColor(notification.type)}`}
          style={{ transition: "width 50ms linear" }}
        />
        
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">
          {getIcon(notification.type)}
        </div>
        
        {/* Message */}
        <p className="flex-1 text-sm font-medium text-white">{notification.message}</p>
        
        {/* Close button */}
        <button
          onClick={() => onDismiss(notification.id)}
          className="text-white/70 hover:text-white transition-colors flex-shrink-0 p-1 hover:bg-white/10 rounded"
        >
          <X className="w-4 h-4" />
        </button>
      </motion.div>
    );
  }

  return (
    <div className="fixed top-4 right-4 z-[100] space-y-3 max-w-md w-full pointer-events-none">
      <AnimatePresence>
        {notifications.map((notification) => (
          <div key={notification.id} className="pointer-events-auto">
            <AutoDismissNotification
              notification={notification}
              onDismiss={removeNotification}
            />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
