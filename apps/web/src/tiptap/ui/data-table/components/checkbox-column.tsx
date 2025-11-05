import { Checkbox } from "@/components/ui/checkbox";
import type { Table } from "@tanstack/react-table";
import { cn } from "@/lib/utils";

export function CheckboxColumn<TData>({
  table,
  selectedLength,
  hoveredHeader,
  setHoveredHeader,
  hoveredRowIndex,
  setHoveredRowIndex,
  rowHeights,
}: {
  table: Table<TData>;
  selectedLength: number;
  hoveredHeader: boolean;
  setHoveredHeader: (hovered: boolean) => void;
  hoveredRowIndex: number | null;
  setHoveredRowIndex: (hovered: number | null) => void;
  rowHeights: Map<number, number>;
}) {
  return (
    <div className="flex flex-col w-10 flex-shrink-0">
      {/* Header checkbox */}
      <div
        className="h-10 flex items-center justify-center"
        onMouseEnter={() => setHoveredHeader(true)}
        onMouseLeave={() => setHoveredHeader(false)}
      >
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className={cn(
            "transition-opacity",
            hoveredHeader || selectedLength > 0 ? "opacity-100" : "opacity-0"
          )}
        />
      </div>

      {/* Row checkboxes */}
      {table.getRowModel().rows.map((row, index) => {
        const isSelected = row.getIsSelected();
        const isHovered = hoveredRowIndex === index;
        const rowHeight = rowHeights.get(index);

        return (
          <div
            key={row.id}
            className="flex justify-center pt-2"
            style={{ height: rowHeight || "auto" }}
            onMouseEnter={() => setHoveredRowIndex(index)}
            onMouseLeave={() => setHoveredRowIndex(null)}
          >
            <Checkbox
              checked={isSelected}
              onCheckedChange={(value) => row.toggleSelected(!!value)}
              aria-label="Select row"
              className={cn(
                "transition-opacity",
                isHovered || isSelected ? "opacity-100" : "opacity-0"
              )}
            />
          </div>
        );
      })}
    </div>
  );
}
