"use client";

import { useState, useCallback } from "react";
import type { CellStateInstance } from "../cell-state-provider";

interface UseCellStateProps {
  containerRef: React.RefObject<HTMLTableElement | null>;
}

export function useCellState({
  containerRef,
}: UseCellStateProps): Omit<CellStateInstance, "updateCellData"> {
  const [editingCell, setEditingCell] = useState<{
    rowIndex: number;
    columnId: string;
  } | null>(null);

  const [focusedCell, setFocusedCell] = useState<{
    rowIndex: number;
    columnId: string;
  } | null>(null);

  const refocusTable = useCallback(() => {
    // Use requestAnimationFrame to ensure DOM has updated
    requestAnimationFrame(() => {
      containerRef.current?.focus();
    });
  }, [containerRef]);

  const scrollCellIntoView = useCallback(
    (columnId: string) => {
      const container = containerRef.current;
      if (!container) return;

      // Find the nearest horizontal scrollable parent of the table
      const getHorizontalScrollParent = (el: HTMLElement | null) => {
        let node: HTMLElement | null = el ? el.parentElement : null;
        while (node) {
          const style = window.getComputedStyle(node);
          const overflowX = style.overflowX;
          const isScrollable =
            (overflowX === "auto" ||
              overflowX === "scroll" ||
              overflowX === "overlay") &&
            node.scrollWidth > node.clientWidth;
          if (isScrollable) return node;
          node = node.parentElement;
        }
        return null;
      };

      const scrollContainer = getHorizontalScrollParent(container) || container;

      // Use header as anchor for horizontal position (row index not needed)
      const header = container.querySelector(
        `th[data-column-id="${CSS.escape(columnId)}"]`
      ) as HTMLElement | null;
      if (!header) return;

      // Scroll horizontally to reveal the cell
      const containerRect = scrollContainer.getBoundingClientRect();
      const cellRect = header.getBoundingClientRect();

      const leftOverflow = cellRect.left < containerRect.left;
      const rightOverflow = cellRect.right > containerRect.right;

      if (leftOverflow) {
        scrollContainer.scrollLeft -= containerRect.left - cellRect.left + 8;
      } else if (rightOverflow) {
        scrollContainer.scrollLeft += cellRect.right - containerRect.right + 8;
      }
    },
    [containerRef]
  );

  return {
    editingCell,
    focusedCell,
    setEditingCell,
    setFocusedCell,
    refocusTable,
    scrollCellIntoView,
  };
}
