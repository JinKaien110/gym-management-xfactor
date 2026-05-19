import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, AlertCircle, AlertTriangle } from "lucide-react";

// Form field wrapper with validation
export function FormField({ 
  children, 
  error, 
  success, 
  label, 
  required = false,
  className = "" 
}) {
  const hasError = !!error;
  const hasSuccess = !!success && !hasError;

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-slate-300">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {children}
        {/* Success indicator */}
        {hasSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            <CheckCircle className="w-5 h-5 text-green-500" />
          </motion.div>
        )}
      </div>
      {/* Error message */}
      <AnimatePresence mode="wait">
        {hasError && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-1.5 text-red-400 text-sm"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Animated input with validation
export function ValidatedInput({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  error,
  success,
  required = false,
  disabled = false,
  className = "",
  icon: Icon,
  ...props
}) {
  const hasError = !!error;
  const hasSuccess = !!success && !hasError && value.length > 0;

  return (
    <FormField label={label} error={error} success={success} required={required}>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        )}
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            w-full ${Icon ? 'pl-10' : 'pl-4'} pr-4 py-2.5 
            bg-slate-800/60 backdrop-blur-sm border rounded-lg 
            text-white placeholder-slate-400 
            transition-all duration-200 shadow-inner
            disabled:opacity-50 disabled:cursor-not-allowed
            ${hasError 
              ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20' 
              : hasSuccess
                ? 'border-green-500 focus:border-green-500 focus:ring-2 focus:ring-green-500/20'
                : 'border-white/10 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
            }
            focus:outline-none
            ${className}
          `}
          {...props}
        />
      </div>
    </FormField>
  );
}

// Animated select with validation
export function ValidatedSelect({
  label,
  value,
  onChange,
  options = [],
  placeholder = "Select an option",
  error,
  success,
  required = false,
  disabled = false,
  className = "",
  icon: Icon,
  ...props
}) {
  const hasError = !!error;
  const hasSuccess = !!success && !hasError && value;

  return (
    <FormField label={label} error={error} success={success} required={required}>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 z-10" />
        )}
        <select
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`
            w-full ${Icon ? 'pl-10' : 'pl-4'} pr-4 py-2.5 
            bg-slate-800/60 backdrop-blur-sm border rounded-lg 
            text-white appearance-none
            transition-all duration-200 shadow-inner
            disabled:opacity-50 disabled:cursor-not-allowed
            ${hasError 
              ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20' 
              : hasSuccess
                ? 'border-green-500 focus:border-green-500 focus:ring-2 focus:ring-green-500/20'
                : 'border-white/10 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
            }
            focus:outline-none
            ${className}
          `}
          {...props}
        >
          <option value="" className="bg-slate-800">{placeholder}</option>
          {options.map((option) => (
            <option 
              key={option.value} 
              value={option.value} 
              className="bg-slate-800"
            >
              {option.label}
            </option>
          ))}
        </select>
        {/* Custom arrow */}

      </div>
    </FormField>
  );
}

// Checkbox with animation
export function AnimatedCheckbox({
  label,
  checked,
  onChange,
  error,
  className = "",
}) {
  return (
    <div className={`flex items-start gap-3 ${className}`}>
      <motion.button
        type="button"
        onClick={() => onChange(!checked)}
        className={`
          w-5 h-5 rounded border-2 flex items-center justify-center transition-all
          ${checked 
            ? 'bg-red-600 border-red-600' 
            : 'bg-transparent border-slate-500 hover:border-slate-400'
          }
        `}
        whileTap={{ scale: 0.9 }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: checked ? 1 : 0, scale: checked ? 1 : 0 }}
        >
          <CheckCircle className="w-3.5 h-3.5 text-white" />
        </motion.div>
      </motion.button>
      {label && (
        <label 
          onClick={() => onChange(!checked)}
          className="text-sm text-slate-300 cursor-pointer flex-1"
        >
          {label}
        </label>
      )}
    </div>
  );
}

// Radio group with animation
export function AnimatedRadioGroup({
  options = [],
  value,
  onChange,
  label,
  error,
  className = "",
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-slate-300">
          {label}
        </label>
      )}
      <div className="flex flex-wrap gap-3">
        {options.map((option) => (
          <motion.button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`
              px-4 py-2 rounded-lg border transition-all duration-200
              ${value === option.value
                ? 'bg-red-600/20 border-red-500 text-red-400'
                : 'bg-slate-800/60 border-white/10 text-slate-400 hover:border-white/20 hover:text-white'
              }
            `}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {option.label}
          </motion.button>
        ))}
      </div>
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-1.5 text-red-400 text-sm"
        >
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </motion.div>
      )}
    </div>
  );
}
