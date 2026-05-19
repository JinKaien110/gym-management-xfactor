import React from "react";
import { Search, X } from "lucide-react";
import { motion } from "framer-motion";

export default function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
  onClear,
  className = "",
  icon: Icon = Search,
  autoFocus = false,
}) {
  const handleClear = () => {
    if (onClear) {
      onClear();
    } else {
      onChange({ target: { value: "" } });
    }
  };

  return (
    <div className={`relative ${className}`}>
      <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="
          w-full pl-10 pr-10 py-2.5 
          bg-slate-800/60 backdrop-blur-sm 
          border border-white/10 rounded-lg 
          text-white placeholder-slate-400 
          focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20
          transition-all duration-200
          shadow-inner
        "
      />
      {value && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          type="button"
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-all"
        >
          <X className="w-4 h-4" />
        </motion.button>
      )}
    </div>
  );
}

// Search with suggestions dropdown
export function SearchWithSuggestions({
  value,
  onChange,
  suggestions = [],
  onSelect,
  placeholder = "Search...",
  loading = false,
  className = "",
}) {
  const [showSuggestions, setShowSuggestions] = React.useState(false);

  const handleInputChange = (e) => {
    onChange(e);
    setShowSuggestions(e.target.value.length > 0);
  };

  const handleSelect = (suggestion) => {
    onSelect(suggestion);
    setShowSuggestions(false);
  };

  return (
    <div className={`relative ${className}`}>
      <SearchInput
        value={value}
        onChange={handleInputChange}
        placeholder={placeholder}
      />
      
      {showSuggestions && suggestions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-full left-0 right-0 mt-2 bg-slate-800/95 backdrop-blur-xl border border-white/10 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSelect(suggestion)}
              className="w-full px-4 py-2 text-left text-white hover:bg-white/10 transition-colors first:rounded-t-lg last:rounded-b-lg"
            >
              {suggestion}
            </button>
          ))}
        </motion.div>
      )}
    </div>
  );
}
