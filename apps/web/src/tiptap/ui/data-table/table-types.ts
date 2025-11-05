import type { RowData } from "@tanstack/react-table";
import type { ColumnType } from "./utils";

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface TableMeta<TData extends RowData> {
    updateData: (rowIndex: number, columnId: string, value: unknown) => void;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    columnType?: ColumnType;
    excludeFromNav?: boolean;
    isPhantom?: boolean;
  }
}
