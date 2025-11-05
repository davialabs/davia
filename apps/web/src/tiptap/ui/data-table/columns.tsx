import { ColumnDef } from "@tanstack/react-table";
import { memo } from "react";
import {
  TypeIcon,
  HashIcon,
  ToggleRightIcon,
  BracesIcon,
  Plus,
} from "lucide-react";
import { ColumnMetadata } from "./utils";
import { EditableCell } from "./components/editable-cell";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

function getTypeIcon(type: string) {
  switch (type) {
    case "string":
      return TypeIcon;
    case "number":
      return HashIcon;
    case "boolean":
      return ToggleRightIcon;
    case "complex":
      return BracesIcon;
    default:
      return BracesIcon;
  }
}

const ColumnHeader = memo(
  ({ type, displayName }: { type: string; displayName: string }) => {
    const IconComponent = getTypeIcon(type);
    return (
      <>
        <IconComponent className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="truncate flex-1">{displayName}</span>
      </>
    );
  }
);
ColumnHeader.displayName = "ColumnHeader";

export function createColumns(
  columnsMetadata: ColumnMetadata[]
): ColumnDef<Record<string, unknown>>[] {
  return columnsMetadata.map(({ key, type, displayName }) => ({
    accessorKey: key,
    header: () => <ColumnHeader type={type} displayName={displayName} />,
    cell: ({ row }) => (
      <EditableCell
        value={row.getValue(key)}
        type={type}
        rowIndex={row.index}
        columnId={key}
      />
    ),
    meta: { columnType: type },
    minSize: 150,
    size: 200,
    maxSize: Number.MAX_SAFE_INTEGER,
  }));
}

export const PHANTOM_COLUMN_ID = "__phantom__";

export function createPhantomColumn({
  onAddColumn,
  setColumnOrder,
}: {
  onAddColumn: (
    type: "string" | "number" | "boolean" | "complex"
  ) => string | void;
  setColumnOrder: React.Dispatch<React.SetStateAction<string[]>>;
}): ColumnDef<Record<string, unknown>> {
  const columnTypes = [
    { type: "string" as const, label: "Text", icon: TypeIcon },
    { type: "number" as const, label: "Number", icon: HashIcon },
    { type: "boolean" as const, label: "Switch", icon: ToggleRightIcon },
  ];

  return {
    id: PHANTOM_COLUMN_ID,
    header: () => (
      <DropdownMenu modal={false}>
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button size="icon-sm" variant="ghost" className="size-6">
                <Plus className="size-3" />
                <span className="sr-only">Add column</span>
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>Add column</TooltipContent>
        </Tooltip>
        <DropdownMenuContent>
          <DropdownMenuLabel>Select type</DropdownMenuLabel>
          {columnTypes.map(({ type, label, icon: Icon }) => (
            <DropdownMenuItem
              key={type}
              onClick={() => {
                const newKey = onAddColumn(type);
                if (newKey) {
                  setColumnOrder((prev) => {
                    const without = prev.filter(
                      (id) => id !== PHANTOM_COLUMN_ID
                    );
                    return [...without, newKey, PHANTOM_COLUMN_ID];
                  });
                }
              }}
            >
              <Icon />
              {label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    ),
    cell: () => (
      <div
        className="min-h-5"
        tabIndex={-1}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        onFocusCapture={(e) => e.stopPropagation()}
      />
    ),
    meta: { excludeFromNav: true, isPhantom: true },
    enableResizing: false,
    size: 80,
    maxSize: Number.MAX_SAFE_INTEGER,
  };
}
