import { useEffect, useCallback } from "react";

// Hook for keyboard navigation support
export function useKeyboardNavigation({
  items,
  onSelect,
  onEscape,
  onArrowUp,
  onArrowDown,
  onEnter,
  activeIndex,
  setActiveIndex,
}) {
  const handleKeyDown = useCallback((e) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (onArrowDown) {
          onArrowDown();
        } else if (items && setActiveIndex) {
          setActiveIndex((prev) => 
            prev < items.length - 1 ? prev + 1 : 0
          );
        }
        break;
      case "ArrowUp":
        e.preventDefault();
        if (onArrowUp) {
          onArrowUp();
        } else if (items && setActiveIndex) {
          setActiveIndex((prev) => 
            prev > 0 ? prev - 1 : items.length - 1
          );
        }
        break;
      case "Enter":
        e.preventDefault();
        if (onEnter) {
          onEnter();
        } else if (onSelect && activeIndex !== undefined && items) {
          onSelect(items[activeIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        if (onEscape) {
          onEscape();
        }
        break;
      default:
        break;
    }
  }, [items, activeIndex, setActiveIndex, onSelect, onEscape, onArrowDown, onArrowUp, onEnter]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}

// Hook for focus management
export function useFocusManagement() {
  useEffect(() => {
    // Add focus-visible class to focused elements
    const handleFocus = (e) => {
      if (e.target.matches('button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])')) {
        e.target.classList.add("focus-visible");
      }
    };

    const handleBlur = (e) => {
      e.target.classList.remove("focus-visible");
    };

    document.addEventListener("focusin", handleFocus);
    document.addEventListener("focusout", handleBlur);

    return () => {
      document.removeEventListener("focusin", handleFocus);
      document.removeEventListener("focusout", handleBlur);
    };
  }, []);
}

// Hook for trap focus in modal
export function useTrapFocus(containerRef) {
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e) => {
      if (e.key !== "Tab") return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener("keydown", handleTabKey);
    firstElement?.focus();

    return () => {
      container.removeEventListener("keydown", handleTabKey);
    };
  }, [containerRef]);
}
