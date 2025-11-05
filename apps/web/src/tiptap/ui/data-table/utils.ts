import { sentenceCase } from "change-case";
import { PHANTOM_COLUMN_ID } from "./columns";

export type ColumnType = "string" | "number" | "boolean" | "complex";

export interface ColumnMetadata {
  key: string;
  type: ColumnType;
  displayName: string;
}

export function inferColumnType(values: unknown[]): ColumnType {
  const nonNullValues = values.filter((v) => v !== null && v !== undefined);

  if (nonNullValues.length === 0) return "string";

  const types = new Set(
    nonNullValues.map((v) => {
      if (typeof v === "boolean") return "boolean";
      if (typeof v === "number") return "number";
      if (typeof v === "string") return "string";
      return "complex"; // object or array
    })
  );

  if (types.has("complex")) return "complex";
  if (types.size > 1) {
    // Mixed primitives - check if boolean + number
    if (types.has("boolean") && types.has("number")) return "string";
    // Any mix with string → string
    if (types.has("string")) return "string";
  }

  return Array.from(types)[0] as ColumnType;
}

export function getColumnValues(
  data: Record<string, unknown>[],
  columnKey: string
): unknown[] {
  return data.map((row) => row[columnKey]);
}

export function inferColumnsMetadata(
  data: Record<string, unknown>[]
): ColumnMetadata[] {
  if (!Array.isArray(data) || data.length === 0) return [];

  // Get all unique column keys
  const allKeys = [...new Set(data.flatMap((row) => Object.keys(row)))];

  return allKeys.map((key) => {
    const columnValues = getColumnValues(data, key);
    const type = inferColumnType(columnValues);
    const displayName = sentenceCase(key);

    return {
      key,
      type,
      displayName,
    };
  });
}

export function generateUniqueColumnKey(
  desiredKey: string,
  existingKeys: string[]
): string {
  if (!existingKeys.includes(desiredKey)) {
    return desiredKey;
  }

  let counter = 1;
  let newKey = `${desiredKey}${counter}`;

  while (existingKeys.includes(newKey)) {
    counter++;
    newKey = `${desiredKey}${counter}`;
  }

  return newKey;
}

// Utilities to enforce phantom column ordering
export function ensurePhantomLast(order: string[]) {
  const w = order.filter((id) => id !== PHANTOM_COLUMN_ID);
  return [...w, PHANTOM_COLUMN_ID];
}
