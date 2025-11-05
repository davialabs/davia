"use client";

import { createContext, type ReactNode, use } from "react";

export type CellStateInstance = {
  editingCell: { rowIndex: number; columnId: string } | null;
  focusedCell: { rowIndex: number; columnId: string } | null;
  setEditingCell: (cell: { rowIndex: number; columnId: string } | null) => void;
  setFocusedCell: (cell: { rowIndex: number; columnId: string } | null) => void;
  refocusTable: () => void;
  scrollCellIntoView: (columnId: string) => void;
  updateCellData: (rowIndex: number, columnId: string, value: unknown) => void;
};

const CellStateContext = createContext<CellStateInstance | null>(null);

type CellStateProviderProps = {
  cellState: Omit<CellStateInstance, "updateCellData">;
  updateCellData: (rowIndex: number, columnId: string, value: unknown) => void;
  children: ReactNode;
};

export function CellStateProvider({
  cellState,
  updateCellData,
  children,
}: CellStateProviderProps) {
  const contextValue: CellStateInstance = {
    ...cellState,
    updateCellData,
  };

  return <CellStateContext value={contextValue}>{children}</CellStateContext>;
}

export function useCellStateContext() {
  const cellState = use(CellStateContext);

  if (!cellState) {
    throw new Error(
      "useCellStateContext must be used within a CellStateProvider"
    );
  }

  return cellState;
}
