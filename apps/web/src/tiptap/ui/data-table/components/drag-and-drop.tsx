"use client";

import { type CSSProperties } from "react";
import { flexRender, type Cell, type Header } from "@tanstack/react-table";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { HeaderDropdown } from "./header-dropdown";
import { TableCell, TableHead } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export function DraggableTableHeader<TData, TValue>({
  header,
  onRenameColumn,
  onDeleteColumn,
  setColumnOrder,
}: {
  header: Header<TData, TValue>;
  onRenameColumn: (oldKey: string, newKey: string) => void;
  onDeleteColumn: (columnKey: string) => void;
  setColumnOrder: React.Dispatch<React.SetStateAction<string[]>>;
}) {
  const { attributes, isDragging, listeners, setNodeRef, transform } =
    useSortable({
      id: header.column.id,
    });

  const style: CSSProperties = {
    opacity: isDragging ? 0.8 : 1,
    position: "relative",
    transform: CSS.Translate.toString(transform), // translate instead of transform to avoid squishing
    transition: "width transform 0.2s ease-in-out",
    width: header.column.getSize(),
    zIndex: isDragging ? 1 : 0,
  };

  return (
    <TableHead
      colSpan={header.colSpan}
      ref={setNodeRef}
      style={{
        ...style,
        width: header.column.getSize(),
        maxWidth: header.column.getSize(),
      }}
      className={cn(
        "relative !p-0",
        isDragging ? "bg-muted/50" : "hover:bg-muted/50"
      )}
      data-column-id={header.column.id}
    >
      {header.isPlaceholder ? null : (
        <div className="relative flex items-center gap-2 p-2">
          {/* Drag handle - covers the entire cell */}
          <div
            {...attributes}
            {...listeners}
            className="absolute inset-0 cursor-grab active:cursor-grabbing z-10"
          />

          {flexRender(header.column.columnDef.header, header.getContext())}

          {/* Header dropdown - positioned on the right */}
          <HeaderDropdown
            columnKey={header.column.id}
            onRename={onRenameColumn}
            onDelete={onDeleteColumn}
            setColumnOrder={setColumnOrder}
          />
        </div>
      )}

      {header.column.getCanResize() && (
        <div
          onMouseDown={header.getResizeHandler()}
          onTouchStart={header.getResizeHandler()}
          className={cn(
            "absolute -right-0.5 top-0 z-20 h-full w-1 hover:bg-border transition-colors duration-200 cursor-col-resize select-none touch-none",
            header.column.getIsResizing() && "bg-cyan-500"
          )}
        />
      )}
    </TableHead>
  );
}

export function DragAlongCell<TData, TValue>({
  cell,
}: {
  cell: Cell<TData, TValue>;
}) {
  const { isDragging, setNodeRef, transform } = useSortable({
    id: cell.column.id,
  });

  const style: CSSProperties = {
    opacity: isDragging ? 0.8 : 1,
    position: "relative",
    transform: CSS.Translate.toString(transform),
    transition: "width transform 0.2s ease-in-out",
    width: cell.column.getSize(),
    zIndex: isDragging ? 1 : 0,
  };

  return (
    <TableCell
      ref={setNodeRef}
      style={{ ...style, maxWidth: cell.column.getSize(), height: 1 }}
      className={cn(
        "!align-top !whitespace-normal !break-words !p-0",
        cell.column.getIndex() < cell.row.getVisibleCells().length - 1 &&
          "border-r"
      )}
    >
      {flexRender(cell.column.columnDef.cell, cell.getContext())}
    </TableCell>
  );
}
