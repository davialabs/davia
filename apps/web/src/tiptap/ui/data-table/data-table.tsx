"use client";

import { useMemo, useRef } from "react";
import "./table-types";
import {
  useHoverAndHeights,
  useTableState,
  useTableOperations,
  useCellState,
  useKeyboardNavigation,
} from "./hooks";
import { CellStateProvider } from "./cell-state-provider";
import { createPhantomColumn, PHANTOM_COLUMN_ID } from "./columns";
import { ensurePhantomLast } from "./utils";
import {
  CheckboxColumn,
  DragAlongCell,
  DraggableTableHeader,
  AddRow,
  DeleteRows,
} from "./components";
import {
  useReactTable,
  getCoreRowModel,
  type ColumnDef,
  flexRender,
} from "@tanstack/react-table";
import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  type DragEndEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { restrictToHorizontalAxis } from "@dnd-kit/modifiers";
import {
  arrayMove,
  SortableContext,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  Table,
  TableHeader,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
} from "@/components/ui/table";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  storageKey: string;
  updateData: (next: TData[]) => void;
}

export function DataTable<TData, TValue>({
  data,
  columns,
  storageKey,
  updateData,
}: DataTableProps<TData, TValue>) {
  const containerRef = useRef<HTMLTableElement>(null);

  // Table state
  const {
    rowSelection,
    setRowSelection,
    columnSizing,
    setColumnSizing,
    columnOrder,
    setColumnOrder,
  } = useTableState({ columns, storageKey });

  // Hover and heights
  const {
    hoveredHeader,
    setHoveredHeader,
    hoveredRowIndex,
    setHoveredRowIndex,
    rowHeights,
    rowRefs,
  } = useHoverAndHeights({ data });

  // Table operations
  const {
    handleCellUpdate,
    handleRenameColumn,
    handleDeleteColumn,
    handleAddColumn,
    handleAddRow,
    handleDeleteRows,
  } = useTableOperations({
    data: data as Record<string, unknown>[],
    updateData: updateData as (next: Record<string, unknown>[]) => void,
  });

  // Augment columns with phantom column at the end
  const augmentedColumns = useMemo(() => {
    const phantom = createPhantomColumn({
      onAddColumn: (type) => handleAddColumn(type),
      setColumnOrder,
    });
    return [...columns, phantom] as ColumnDef<TData, TValue>[];
  }, [columns, handleAddColumn, setColumnOrder]);

  // Cell state and keyboard navigation
  const cellState = useCellState({
    containerRef,
  });

  // Create combined cell state for components that need the full interface
  const fullCellState = {
    ...cellState,
    updateCellData: handleCellUpdate,
  };

  const effectiveColumnOrder = ensurePhantomLast(columnOrder);
  const nonPhantomOrder = effectiveColumnOrder.filter(
    (id) => id !== PHANTOM_COLUMN_ID
  );

  // Tanstack table
  const table = useReactTable({
    data,
    columns: augmentedColumns,
    getCoreRowModel: getCoreRowModel(),
    columnResizeMode: "onChange",
    enableColumnResizing: true,
    state: {
      rowSelection,
      columnSizing,
      columnOrder: effectiveColumnOrder,
    },
    onRowSelectionChange: setRowSelection,
    onColumnSizingChange: setColumnSizing,
    onColumnOrderChange: (updater) => {
      if (typeof updater === "function") {
        setColumnOrder((prev) => ensurePhantomLast(updater(prev)));
      } else {
        setColumnOrder(ensurePhantomLast(updater));
      }
    },
  });

  // Update keyboard navigation with actual table instance
  const { handleKeyDown } = useKeyboardNavigation({
    table: table,
    cellState: fullCellState,
  });

  // Reorder columns after drag & drop
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      setColumnOrder((order) => {
        const without = order.filter((id) => id !== PHANTOM_COLUMN_ID);
        const oldIndex = without.indexOf(active.id as string);
        const newIndex = without.indexOf(over.id as string);
        const nextWithout = arrayMove(without, oldIndex, newIndex);
        return [...nextWithout, PHANTOM_COLUMN_ID];
      });
    }
  }

  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        {Object.keys(rowSelection).length > 0 && (
          <DeleteRows
            onDeleteRows={() => {
              const selectedIndices = Object.keys(rowSelection)
                .filter((key) => rowSelection[key])
                .map((key) => parseInt(key, 10));
              handleDeleteRows(selectedIndices);
              setRowSelection({});
            }}
          />
        )}
        <div className="flex flex-1 items-center justify-end">
          <AddRow onAddRow={handleAddRow} title="New" variant="default" />
        </div>
      </div>
      <div className="flex -ml-10">
        <CheckboxColumn
          table={table}
          selectedLength={Object.keys(rowSelection).length}
          hoveredHeader={hoveredHeader}
          setHoveredHeader={setHoveredHeader}
          hoveredRowIndex={hoveredRowIndex}
          setHoveredRowIndex={setHoveredRowIndex}
          rowHeights={rowHeights}
        />
        <DndContext
          collisionDetection={closestCenter}
          modifiers={[restrictToHorizontalAxis]}
          onDragEnd={handleDragEnd}
          sensors={sensors}
        >
          <CellStateProvider
            cellState={cellState}
            updateCellData={handleCellUpdate}
          >
            <Table
              ref={containerRef}
              tabIndex={0}
              onKeyDown={handleKeyDown}
              onBlur={(e) => {
                if (
                  !e.currentTarget.contains(e.relatedTarget as Node) &&
                  !cellState.editingCell
                ) {
                  cellState.setFocusedCell(null);
                }
              }}
              style={{ minWidth: table.getTotalSize() }}
              className="not-prose w-full outline-none border-b"
            >
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow
                    key={headerGroup.id}
                    className="hover:bg-transparent"
                    onMouseEnter={() => setHoveredHeader(true)}
                    onMouseLeave={() => setHoveredHeader(false)}
                  >
                    <SortableContext
                      items={nonPhantomOrder}
                      strategy={horizontalListSortingStrategy}
                    >
                      {headerGroup.headers.map((header) =>
                        header.id === PHANTOM_COLUMN_ID ? (
                          <TableHead key={header.id}>
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                          </TableHead>
                        ) : (
                          <DraggableTableHeader
                            key={header.id}
                            header={header}
                            onRenameColumn={handleRenameColumn}
                            onDeleteColumn={handleDeleteColumn}
                            setColumnOrder={setColumnOrder}
                          />
                        )
                      )}
                    </SortableContext>
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.length ? (
                  table.getRowModel().rows.map((row, index) => (
                    <TableRow
                      key={row.id}
                      ref={(el) => {
                        if (el) {
                          rowRefs.current.set(index, el);
                        } else {
                          rowRefs.current.delete(index);
                        }
                      }}
                      data-row-index={index}
                      data-state={row.getIsSelected() && "selected"}
                      onMouseEnter={() => setHoveredRowIndex(index)}
                      onMouseLeave={() => setHoveredRowIndex(null)}
                      className="hover:bg-transparent"
                    >
                      <SortableContext
                        items={nonPhantomOrder}
                        strategy={horizontalListSortingStrategy}
                      >
                        {row
                          .getVisibleCells()
                          .map((cell) =>
                            cell.column.id === PHANTOM_COLUMN_ID ? (
                              <TableCell key={cell.id}>
                                {flexRender(
                                  cell.column.columnDef.cell,
                                  cell.getContext()
                                )}
                              </TableCell>
                            ) : (
                              <DragAlongCell key={cell.id} cell={cell} />
                            )
                          )}
                      </SortableContext>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-9 text-center"
                    >
                      Empty table, add a row to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CellStateProvider>
        </DndContext>
      </div>
      <AddRow onAddRow={handleAddRow} title="Add row" variant="ghost" />
    </div>
  );
}
