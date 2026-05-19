import { useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

// Global keyboard shortcuts hook
export function useKeyboardShortcuts(shortcuts = {}) {
  const handleKeyDown = useCallback((e) => {
    // Don't trigger shortcuts when typing in input/textarea
    if (
      e.target.tagName === "INPUT" ||
      e.target.tagName === "TEXTAREA" ||
      e.target.tagName === "SELECT" ||
      e.target.isContentEditable
    ) {
      // Only trigger Escape in inputs
      if (e.key !== "Escape") return;
    }

    // Build shortcut string
    const keys = [];
    if (e.ctrlKey || e.metaKey) keys.push("ctrl");
    if (e.altKey) keys.push("alt");
    if (e.shiftKey) keys.push("shift");
    keys.push(e.key.toLowerCase());

    const shortcutStr = keys.join("+");

    // Check if shortcut exists
    const handler = shortcuts[shortcutStr];
    if (handler) {
      e.preventDefault();
      handler(e);
    }
  }, [shortcuts]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}

// Keyboard shortcuts for admin pages
export function useAdminKeyboardShortcuts() {
  const navigate = useNavigate();

  const shortcuts = {
    "ctrl+1": () => navigate("/admin/dashboard"),
    "ctrl+2": () => navigate("/admin/clients"),
    "ctrl+3": () => navigate("/admin/memberships"),
    "ctrl+4": () => navigate("/admin/payments"),
    "ctrl+5": () => navigate("/admin/classes"),
    "ctrl+6": () => navigate("/admin/schedules"),
    "ctrl+7": () => navigate("/admin/trainers"),
    "ctrl+8": () => navigate("/admin/pricing"),
    "ctrl+9": () => navigate("/admin/plans"),
    "ctrl+/": () => {
      // Focus search - handled by individual pages
      const searchInput = document.querySelector('input[type="search"], input[placeholder*="Search"]');
      searchInput?.focus();
    },
    "ctrl+n": () => {
      // Trigger add action - dispatch custom event
      window.dispatchEvent(new CustomEvent("admin:add"));
    },
    "ctrl+r": () => {
      // Refresh - dispatch custom event
      window.dispatchEvent(new CustomEvent("admin:refresh"));
    },
    "ctrl+h": () => navigate("/admin/dashboard"),
    "escape": () => {
      // Close modals - dispatch custom event
      window.dispatchEvent(new CustomEvent("admin:closeModal"));
    },
  };

  useKeyboardShortcuts(shortcuts);
}

// Keyboard shortcut hint component
export function KeyboardShortcut({ keys = [], className = "" }) {
  if (!keys || keys.length === 0) return null;

  const keyLabels = {
    ctrl: "Ctrl",
    alt: "Alt",
    shift: "Shift",
    enter: "Enter",
    escape: "Esc",
    backspace: "⌫",
    tab: "Tab",
    up: "↑",
    down: "↓",
    left: "←",
    right: "→",
  };

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {keys.map((key, index) => (
        <span key={index} className="flex">
          <kbd className="px-1.5 py-0.5 bg-slate-700/80 border border-slate-600 rounded text-xs text-slate-300 font-mono">
            {keyLabels[key.toLowerCase()] || key}
          </kbd>
          {index < keys.length - 1 && (
            <span className="text-slate-500 mx-0.5">+</span>
          )}
        </span>
      ))}
    </div>
  );
}

// Shortcuts help modal content
export function ShortcutsHelp() {
  const shortcuts = [
    { keys: ["Ctrl", "1"], description: "Go to Dashboard" },
    { keys: ["Ctrl", "2"], description: "Go to clients" },
    { keys: ["Ctrl", "3"], description: "Go to memberships" },
    { keys: ["Ctrl", "4"], description: "Go to Payments" },
    { keys: ["Ctrl", "5"], description: "Go to Classes" },
    { keys: ["Ctrl", "6"], description: "Go to Schedules" },
    { keys: ["Ctrl", "7"], description: "Go to Trainers" },
    { keys: ["Ctrl", "8"], description: "Go to Pricing" },
    { keys: ["Ctrl", "9"], description: "Go to Plans" },
    { keys: ["Ctrl", "/"], description: "Focus search" },
    { keys: ["Ctrl", "N"], description: "Add new item" },
    { keys: ["Ctrl", "R"], description: "Refresh page" },
    { keys: ["Ctrl", "H"], description: "Go to Home" },
    { keys: ["Esc"], description: "Close modal" },
  ];

  return (
    <div className="grid grid-cols-2 gap-2">
      {shortcuts.map((shortcut, index) => (
        <div key={index} className="flex items-center justify-between p-2 bg-slate-700/30 rounded-lg">
          <span className="text-slate-300 text-sm">{shortcut.description}</span>
          <KeyboardShortcut keys={shortcut.keys} />
        </div>
      ))}
    </div>
  );
}
