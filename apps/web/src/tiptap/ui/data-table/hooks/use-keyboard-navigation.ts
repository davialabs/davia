"use client";

import { useCallback } from "react";
import type { Table } from "@tanstack/react-table";
import type { CellStateInstance } from "../cell-state-provider";

interface UseKeyboardNavigationProps<TData> {
  table: Table<TData>;
  cellState: CellStateInstance;
}

export function useKeyboardNavigation<TData>({
  table,
  cellState,
}: UseKeyboardNavigationProps<TData>) {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!cellState.focusedCell) return;

      // Handle Escape key to clear focus when not in editing mode
      if (e.key === "Escape" && !cellState.editingCell) {
        e.preventDefault();
        cellState.setFocusedCell(null);
        return;
      }

      // Don't handle navigation if we're in editing mode
      if (cellState.editingCell) return;

      const { rowIndex, columnId } = cellState.focusedCell;
      const rows = table.getRowModel().rows;
      const totalRows = rows.length;

      const currentRow = rows[rowIndex];
      if (!currentRow) return;

      const visibleCells = currentRow
        .getVisibleCells()
        .filter((c) => !c.column.columnDef.meta?.excludeFromNav);

      const currentColIndex = visibleCells.findIndex(
        (cell) => cell.column.id === columnId
      );
      const totalCols = visibleCells.length;

      switch (e.key) {
        case "Enter":
          e.preventDefault();
          if (!cellState.editingCell) {
            const cell = visibleCells.find((c) => c.column.id === columnId);
            const columnType = cell?.column.columnDef.meta?.columnType;
            if (columnType === "boolean") {
              // Toggle boolean value
              const currentValue = cell?.getValue();
              cellState.updateCellData(rowIndex, columnId, !currentValue);
            } else {
              // Enter edit mode for non-boolean cells
              cellState.setEditingCell(cellState.focusedCell);
            }
          }
          break;

        case "ArrowUp":
          e.preventDefault();
          if (rowIndex > 0) {
            cellState.setFocusedCell({ rowIndex: rowIndex - 1, columnId });
          }
          break;

        case "ArrowDown":
          e.preventDefault();
          if (rowIndex < totalRows - 1) {
            cellState.setFocusedCell({ rowIndex: rowIndex + 1, columnId });
          }
          break;

        case "ArrowLeft":
          e.preventDefault();
          if (currentColIndex > 0) {
            const prevCell = visibleCells[currentColIndex - 1];
            if (prevCell) {
              const nextId = prevCell.column.id;
              cellState.setFocusedCell({ rowIndex, columnId: nextId });
              requestAnimationFrame(() => cellState.scrollCellIntoView(nextId));
            }
          } else if (rowIndex > 0) {
            const prevRow = rows[rowIndex - 1];
            if (prevRow) {
              const prevRowVisibleCells = prevRow
                .getVisibleCells()
                .filter((c) => !c.column.columnDef.meta?.excludeFromNav);
              const lastCell =
                prevRowVisibleCells[prevRowVisibleCells.length - 1];
              if (lastCell) {
                const nextId = lastCell.column.id;
                cellState.setFocusedCell({
                  rowIndex: rowIndex - 1,
                  columnId: nextId,
                });
                requestAnimationFrame(() =>
                  cellState.scrollCellIntoView(nextId)
                );
              }
            }
          }
          break;

        case "ArrowRight":
          e.preventDefault();
          if (currentColIndex < totalCols - 1) {
            const nextCell = visibleCells[currentColIndex + 1];
            if (nextCell) {
              const nextId = nextCell.column.id;
              cellState.setFocusedCell({ rowIndex, columnId: nextId });
              requestAnimationFrame(() => cellState.scrollCellIntoView(nextId));
            }
          } else if (rowIndex < totalRows - 1) {
            const nextRow = rows[rowIndex + 1];
            if (nextRow) {
              const nextRowVisibleCells = nextRow
                .getVisibleCells()
                .filter((c) => !c.column.columnDef.meta?.excludeFromNav);
              const firstCell = nextRowVisibleCells[0];
              if (firstCell) {
                const nextId = firstCell.column.id;
                cellState.setFocusedCell({
                  rowIndex: rowIndex + 1,
                  columnId: nextId,
                });
                requestAnimationFrame(() =>
                  cellState.scrollCellIntoView(nextId)
                );
              }
            }
          }
          break;

        case "Tab":
          e.preventDefault();
          if (e.shiftKey) {
            if (currentColIndex > 0) {
              const prevCell = visibleCells[currentColIndex - 1];
              if (prevCell) {
                const nextId = prevCell.column.id;
                cellState.setFocusedCell({ rowIndex, columnId: nextId });
                requestAnimationFrame(() =>
                  cellState.scrollCellIntoView(nextId)
                );
              }
            } else if (rowIndex > 0) {
              const prevRow = rows[rowIndex - 1];
              if (prevRow) {
                const prevRowVisibleCells = prevRow
                  .getVisibleCells()
                  .filter((c) => !c.column.columnDef.meta?.excludeFromNav);
                const lastCell =
                  prevRowVisibleCells[prevRowVisibleCells.length - 1];
                if (lastCell) {
                  const nextId = lastCell.column.id;
                  cellState.setFocusedCell({
                    rowIndex: rowIndex - 1,
                    columnId: nextId,
                  });
                  requestAnimationFrame(() =>
                    cellState.scrollCellIntoView(nextId)
                  );
                }
              }
            }
          } else {
            if (currentColIndex < totalCols - 1) {
              const nextCell = visibleCells[currentColIndex + 1];
              if (nextCell) {
                const nextId = nextCell.column.id;
                cellState.setFocusedCell({ rowIndex, columnId: nextId });
                requestAnimationFrame(() =>
                  cellState.scrollCellIntoView(nextId)
                );
              }
            } else if (rowIndex < totalRows - 1) {
              const nextRow = rows[rowIndex + 1];
              if (nextRow) {
                const nextRowVisibleCells = nextRow
                  .getVisibleCells()
                  .filter((c) => !c.column.columnDef.meta?.excludeFromNav);
                const firstCell = nextRowVisibleCells[0];
                if (firstCell) {
                  const nextId = firstCell.column.id;
                  cellState.setFocusedCell({
                    rowIndex: rowIndex + 1,
                    columnId: nextId,
                  });
                  requestAnimationFrame(() =>
                    cellState.scrollCellIntoView(nextId)
                  );
                }
              }
            }
          }
          break;
      }
    },
    [table, cellState]
  );

  return { handleKeyDown };
}
