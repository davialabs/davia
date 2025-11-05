"use client";

import { useEffect, useRef, useState } from "react";

export function useHoverAndHeights<TData>({ data }: { data: TData[] }) {
  const [hoveredHeader, setHoveredHeader] = useState(false);
  const [hoveredRowIndex, setHoveredRowIndex] = useState<number | null>(null);
  const [rowHeights, setRowHeights] = useState<Map<number, number>>(new Map());
  const rowRefs = useRef<Map<number, HTMLTableRowElement>>(new Map());

  // Track row heights with ResizeObserver
  useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      setRowHeights((prevHeights) => {
        const newHeights = new Map(prevHeights);
        let hasChanges = false;

        entries.forEach((entry) => {
          const rowIndexAttr = entry.target.getAttribute("data-row-index");
          if (rowIndexAttr !== null) {
            const rowIndex = parseInt(rowIndexAttr, 10);
            // Use getBoundingClientRect to include borders
            const newHeight = (
              entry.target as HTMLElement
            ).getBoundingClientRect().height;
            const prevHeight = prevHeights.get(rowIndex);

            // Only update if the difference is significant (> 1px) to avoid infinite loops
            // caused by sub-pixel rounding differences
            if (
              prevHeight === undefined ||
              Math.abs(newHeight - prevHeight) > 1
            ) {
              newHeights.set(rowIndex, newHeight);
              hasChanges = true;
            }
          }
        });

        return hasChanges ? newHeights : prevHeights;
      });
    });

    // Observe all current row refs
    rowRefs.current.forEach((row) => {
      if (row) resizeObserver.observe(row);
    });

    return () => {
      resizeObserver.disconnect();
    };
  }, [data]); // Re-run when data changes

  return {
    hoveredHeader,
    setHoveredHeader,
    hoveredRowIndex,
    setHoveredRowIndex,
    rowHeights,
    rowRefs,
  };
}
