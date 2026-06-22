import React, { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

interface HighlightOverlayProps {
  selector: string; // CSS Selector of target element
}

export const HighlightOverlay: React.FC<HighlightOverlayProps> = ({ selector }) => {
  const [rect, setRect] = useState<DOMRect | null>(null);
  const shouldReduceMotion = useReducedMotion();

  const updateCoordinates = () => {
    if (!selector) {
      setRect(null);
      return;
    }

    const element = document.querySelector(selector);
    if (element) {
      // Ensure elements are scrolled into focus view smoothly
      element.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
      
      // Delay coordinate reading slightly to let scroll alignments settle
      setTimeout(() => {
        const bounding = element.getBoundingClientRect();
        setRect(bounding);
      }, 300);
    } else {
      setRect(null);
    }
  };

  useEffect(() => {
    // Initial coordinates load
    updateCoordinates();

    // Listen to resize and scroll updates
    window.addEventListener("resize", updateCoordinates);
    window.addEventListener("scroll", updateCoordinates, { passive: true });

    // Fallback interval to capture late dynamic layout renders
    const interval = setInterval(updateCoordinates, 1500);

    return () => {
      window.removeEventListener("resize", updateCoordinates);
      window.removeEventListener("scroll", updateCoordinates);
      clearInterval(interval);
    };
  }, [selector]);

  if (!rect) {
    // Backdrop dims screen full if selector is not found
    return (
      <div 
        className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-[1px] pointer-events-none transition-opacity duration-300"
        aria-hidden="true"
      />
    );
  }

  // Spotlight dimensions with paddings
  const padding = 10;
  const top = rect.top - padding;
  const left = rect.left - padding;
  const width = rect.width + padding * 2;
  const height = rect.height + padding * 2;

  return (
    <div className="fixed inset-0 z-40 pointer-events-none select-none" aria-hidden="true">
      {/* SVG Mask backdrop */}
      <svg className="w-full h-full">
        <defs>
          <mask id="spotlight-mask">
            {/* White covers entire canvas (dimmed backdrop area) */}
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {/* Black cuts out the spotlight hole */}
            <motion.rect
              initial={shouldReduceMotion ? {} : { x: left, y: top, width: width, height: height, rx: 16 }}
              animate={{ x: left, y: top, width: width, height: height, rx: 16 }}
              transition={{ type: "spring", stiffness: 260, damping: 28 }}
              fill="black"
            />
          </mask>
        </defs>

        {/* Dimmed background rect applying the mask */}
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(3, 7, 18, 0.75)"
          className="backdrop-blur-[1px]"
          mask="url(#spotlight-mask)"
        />
      </svg>
    </div>
  );
};

export default HighlightOverlay;
