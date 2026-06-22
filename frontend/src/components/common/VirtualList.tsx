import React, { useState, useEffect, useRef, UIEvent } from "react";

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number; // Height of each row in pixels
  containerHeight: number | string; // Height of the scroll window (e.g., 500 or "60vh")
  renderItem: (item: T, index: number) => React.ReactNode;
  buffer?: number; // Extra items to render offscreen to prevent blank rows during fast scrolling
  className?: string;
}

export function VirtualList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  buffer = 3,
  className = "",
}: VirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [clientHeight, setClientHeight] = useState(0);

  // Initialize and monitor container measurements
  useEffect(() => {
    const el = containerRef.current;
    if (el) {
      setClientHeight(el.clientHeight);
      
      // Handle resizing of the scroll viewport
      const observer = new ResizeObserver((entries) => {
        for (let entry of entries) {
          setClientHeight(entry.contentRect.height);
        }
      });
      observer.observe(el);
      return () => observer.disconnect();
    }
  }, []);

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  // Calculations for active rendering slice
  const totalHeight = items.length * itemHeight;
  
  const startIndex = Math.max(
    0,
    Math.floor(scrollTop / itemHeight) - buffer
  );
  
  const endIndex = Math.min(
    items.length - 1,
    Math.floor((scrollTop + clientHeight) / itemHeight) + buffer
  );

  const visibleItems = items.slice(startIndex, endIndex + 1);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className={`overflow-y-auto relative ${className}`}
      style={{
        height: typeof containerHeight === "number" ? `${containerHeight}px` : containerHeight,
      }}
    >
      {/* Spacer to simulate total height and force vertical scrollbar */}
      <div
        className="w-full"
        style={{
          height: `${totalHeight}px`,
          position: "relative",
        }}
      >
        {/* Render only the visible rows absolutely positioned inside the spacer */}
        {visibleItems.map((item, i) => {
          const index = startIndex + i;
          return (
            <div
              key={index}
              className="absolute left-0 w-full"
              style={{
                top: `${index * itemHeight}px`,
                height: `${itemHeight}px`,
              }}
            >
              {renderItem(item, index)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default VirtualList;
