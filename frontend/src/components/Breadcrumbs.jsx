import { Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { motion } from "framer-motion";

export default function Breadcrumbs({ items = [] }) {
  if (!items || items.length === 0) return null;

  return (
    <nav className="flex items-center gap-1 text-sm" aria-label="Breadcrumb">
      <Link
        to="/admin/dashboard"
        className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
      >
        <Home className="w-4 h-4" />
        <span className="sr-only">Home</span>
      </Link>
      
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        
        return (
          <div key={index} className="flex items-center gap-1">
            <ChevronRight className="w-4 h-4 text-slate-600" />
            {isLast || !item.href ? (
              <span className="text-white font-medium">{item.label}</span>
            ) : (
              <Link
                to={item.href}
                className="text-slate-400 hover:text-white transition-colors"
              >
                {item.label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}

// Page header with breadcrumbs
export function PageHeader({ 
  title, 
  description, 
  breadcrumbs = [], 
  actions,
  className = "" 
}) {
  return (
    <div className={`mb-6 ${className}`}>
      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <div className="mb-3">
          <Breadcrumbs items={breadcrumbs} />
        </div>
      )}
      
      {/* Title and actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-bold text-white"
          >
            {title}
          </motion.h1>
          {description && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-slate-400 mt-1"
            >
              {description}
            </motion.p>
          )}
        </div>
        
        {actions && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-3"
          >
            {actions}
          </motion.div>
        )}
      </div>
    </div>
  );
}
