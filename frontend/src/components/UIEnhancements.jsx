import { motion } from "framer-motion";

// Skeleton Loader for tables - uses tr/td for valid HTML inside tbody
export function TableSkeleton({ rows = 5, columns = 6 }) {
  return (
    <>
      {/* Row skeletons using tr/td for valid HTML inside tbody */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <motion.tr
          key={rowIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: rowIndex * 0.05 }}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <td
              key={colIndex}
              className="px-3 sm:px-6 py-4"
            >
              <div
                className="h-4 bg-slate-600/30 rounded animate-pulse"
                style={{
                  animationDelay: `${rowIndex * 0.05 + colIndex * 0.02}s`,
                  width: colIndex === 0 ? '60%' : '80%',
                }}
              />
            </td>
          ))}
        </motion.tr>
      ))}
    </>
  );
}

// Card skeleton for dashboard/stats
export function CardSkeleton() {
  return (
    <div className="bg-slate-800/60 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <div className="w-20 h-3 bg-slate-600/50 rounded animate-pulse" />
          <div className="w-32 h-8 bg-slate-600/50 rounded animate-pulse" />
        </div>
        <div className="w-12 h-12 bg-slate-600/50 rounded-xl animate-pulse" />
      </div>
      <div className="w-24 h-3 bg-slate-600/30 rounded mt-4 animate-pulse" />
    </div>
  );
}

// Stats Grid skeleton
export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

// List skeleton for activity lists
export function ListSkeleton({ items = 5 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          className="flex items-center gap-3 p-3 bg-slate-700/20 rounded-xl"
        >
          <div className="w-10 h-10 bg-slate-600/50 rounded-full animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="w-3/4 h-3 bg-slate-600/50 rounded animate-pulse" />
            <div className="w-1/2 h-2 bg-slate-600/30 rounded animate-pulse" />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// Empty State component
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  onAction
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-16 px-4"
    >
      <div className="w-20 h-20 rounded-full bg-slate-700/50 flex items-center justify-center mb-4">
        {Icon && <Icon className="w-10 h-10 text-slate-500" />}
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-slate-400 text-center max-w-md mb-6">{description}</p>
      {action && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onAction}
          className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white rounded-lg font-medium transition-all duration-200 shadow-lg shadow-red-500/25"
        >
          {action}
        </motion.button>
      )}
    </motion.div>
  );
}

// Page transition wrapper
export function PageTransition({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

// Button with scale animation
export function AnimatedButton({
  children,
  onClick,
  className = "",
  variant = "primary",
  disabled = false,
  ...props
}) {
  const baseClasses = "px-4 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2";
  
  const variants = {
    primary: "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white shadow-lg shadow-red-500/25",
    secondary: "bg-slate-700/60 hover:bg-slate-600/80 backdrop-blur-sm text-white border border-white/10",
    ghost: "bg-transparent hover:bg-slate-700/50 text-slate-300 hover:text-white"
  };

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variants[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
}

// Status badge with glow effect
export function StatusBadge({ status, type = "default" }) {
  const statusConfig = {
    default: {
      active: "bg-green-600/20 text-green-400 border border-green-500/30",
      inactive: "bg-slate-600/20 text-slate-400 border border-slate-500/30",
      archived: "bg-yellow-600/20 text-yellow-400 border border-yellow-500/30",
    },
    payment: {
      PAID: "bg-green-600/20 text-green-400 border border-green-500/30",
      PENDING: "bg-yellow-600/20 text-yellow-400 border border-yellow-500/30",
      FAILED: "bg-red-600/20 text-red-400 border border-red-500/30",
    },
    booking: {
      confirmed: "bg-green-600/20 text-green-400 border border-green-500/30",
      cancelled: "bg-red-600/20 text-red-400 border border-red-500/30",
      pending: "bg-yellow-600/20 text-yellow-400 border border-yellow-500/30",
    }
  };

  const config = statusConfig[type] || statusConfig.default;
  const className = config[status?.toLowerCase()] || config.default;

  return (
    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${className} shadow-sm`}>
      {status}
    </span>
  );
}

// Input with focus animation
export function AnimatedInput({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  className = "",
  icon: Icon,
  ...props
}) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-slate-300">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        )}
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`
            w-full ${Icon ? 'pl-10' : 'pl-4'} pr-4 py-2.5 
            bg-slate-800/60 backdrop-blur-sm border border-white/10 
            rounded-lg text-white placeholder-slate-400 
            focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 
            transition-all duration-200 shadow-inner
            ${className}
          `}
          {...props}
        />
      </div>
    </div>
  );
}
