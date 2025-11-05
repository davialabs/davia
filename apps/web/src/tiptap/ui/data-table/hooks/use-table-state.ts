"use client";

import { useState, useEffect } from "react";
import { useLocalStorage } from "usehooks-ts";
import type {
  RowSelectionState,
  ColumnSizingState,
  ColumnDef,
} from "@tanstack/react-table";

export function useTableState<TData, TValue>({
  columns,
  storageKey,
}: {
  columns: ColumnDef<TData, TValue>[];
  storageKey: string;
}) {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});
  const [columnOrder, setColumnOrder] = useState<string[]>([]);

  // Single localStorage key for all table state
  const [localStorageState, setLocalStorageState] = useLocalStorage<{
    rowSelection: RowSelectionState;
    columnSizing: ColumnSizingState;
    columnOrder: string[];
  }>(storageKey, {
    rowSelection: {},
    columnSizing: {},
    columnOrder: [],
  });

  // Initialize state from localStorage on mount
  useEffect(() => {
    setRowSelection(localStorageState.rowSelection);
    setColumnSizing(localStorageState.columnSizing);
    if (localStorageState.columnOrder.length > 0) {
      setColumnOrder(localStorageState.columnOrder);
    } else {
      setColumnOrder(
        columns.map((col) => {
          if (typeof col.id === "string") return col.id;
          if ("accessorKey" in col && typeof col.accessorKey === "string")
            return col.accessorKey;
          return `col-${Math.random().toString(36).slice(2, 11)}`;
        })
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update localStorage whenever state changes
  useEffect(() => {
    setLocalStorageState({
      rowSelection,
      columnSizing,
      columnOrder,
    });
  }, [rowSelection, columnSizing, columnOrder, setLocalStorageState]);

  return {
    rowSelection,
    setRowSelection,
    columnSizing,
    setColumnSizing,
    columnOrder,
    setColumnOrder,
  };
}
