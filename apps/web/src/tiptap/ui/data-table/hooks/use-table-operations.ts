"use client";

import { useMemo, useCallback } from "react";
import {
  inferColumnsMetadata,
  generateUniqueColumnKey,
  ColumnType,
} from "../utils";

interface UseTableOperationsProps {
  data: Record<string, unknown>[];
  updateData: (next: Record<string, unknown>[]) => void;
}

export function useTableOperations({
  data,
  updateData,
}: UseTableOperationsProps) {
  const columnsMetadata = useMemo(() => inferColumnsMetadata(data), [data]);

  const handleCellUpdate = useCallback(
    (rowIndex: number, columnKey: string, newValue: unknown) => {
      const updatedData = data.map((row, idx) =>
        idx === rowIndex ? { ...row, [columnKey]: newValue } : row
      );
      updateData(updatedData);
    },
    [data, updateData]
  );

  const handleRenameColumn = useCallback(
    (oldKey: string, newKey: string) => {
      const existingKeys = Object.keys(data[0] || {});
      const uniqueNewKey = generateUniqueColumnKey(newKey, existingKeys);

      const updatedData = data.map((row) => {
        const { [oldKey]: value, ...rest } = row;
        return { ...rest, [uniqueNewKey]: value };
      });
      updateData(updatedData);
    },
    [data, updateData]
  );

  const handleDeleteColumn = useCallback(
    (columnKey: string) => {
      const updatedData = data.map((row) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [columnKey]: removed, ...rest } = row;
        return rest;
      });
      updateData(updatedData);
    },
    [data, updateData]
  );

  const handleAddColumn = useCallback(
    (type: ColumnType) => {
      const existingKeys = Object.keys(data[0] || {});
      const baseNames: Record<ColumnType, string> = {
        string: "text",
        number: "number",
        boolean: "switch",
        complex: "complex",
      };
      const baseName = baseNames[type];
      const newKey = generateUniqueColumnKey(baseName, existingKeys);

      // Set appropriate default value based on column type
      const defaultValue = (() => {
        switch (type) {
          case "string":
            return "";
          case "number":
            return 0;
          case "boolean":
            return false;
          case "complex":
            return null;
          default:
            return null;
        }
      })();

      // If there is no data yet, initialize with a first row that contains
      // only the newly added column with its default value based on type.
      if (data.length === 0) {
        const initialRow: Record<string, unknown> = { [newKey]: defaultValue };
        updateData([initialRow]);
        return newKey;
      }

      // Add the new column only to the first row
      const updatedData = data.map((row, index) => ({
        ...row,
        ...(index === 0 && { [newKey]: defaultValue }),
      }));
      updateData(updatedData);

      // Return the new key so it can be added to column order
      return newKey;
    },
    [data, updateData]
  );

  const handleAddRow = useCallback(() => {
    // If there is no data yet, initialize with a first row containing `text`.
    if (data.length === 0) {
      updateData([{ text: "" }]);
      return;
    }

    // Create a new row with default values based on column metadata
    const newRow: Record<string, unknown> = {};

    columnsMetadata.forEach(
      ({ key, type }: { key: string; type: ColumnType }) => {
        switch (type) {
          case "string":
            newRow[key] = "";
            break;
          case "number":
            newRow[key] = 0;
            break;
          case "boolean":
            newRow[key] = false;
            break;
          case "complex":
            newRow[key] = null;
            break;
          default:
            newRow[key] = null;
        }
      }
    );

    updateData([...data, newRow]);
  }, [columnsMetadata, data, updateData]);

  const handleDeleteRows = useCallback(
    (rowIndices: number[]) => {
      // Sort indices in descending order to avoid index shifting issues
      const sortedIndices = [...rowIndices].sort((a, b) => b - a);

      // Remove rows by index
      const updatedData = [...data];
      sortedIndices.forEach((index) => {
        updatedData.splice(index, 1);
      });

      updateData(updatedData);
    },
    [data, updateData]
  );

  return {
    columnsMetadata,
    handleCellUpdate,
    handleRenameColumn,
    handleDeleteColumn,
    handleAddColumn,
    handleAddRow,
    handleDeleteRows,
  };
}
