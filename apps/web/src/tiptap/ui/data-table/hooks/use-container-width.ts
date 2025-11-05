import { useEffect, useState } from "react";

export function useContainerWidth({
  tableTotalSize,
  containerRef,
}: {
  tableTotalSize: number;
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [containerWidth, setContainerWidth] = useState(0);

  // Track container width
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, [containerRef]);

  const phantomWidth = Math.max(80, containerWidth - tableTotalSize);

  return { phantomWidth };
}
