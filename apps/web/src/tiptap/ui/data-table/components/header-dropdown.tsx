"use client";

import { useState } from "react";
import { camelCase, sentenceCase } from "change-case";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EllipsisVerticalIcon, Trash2Icon } from "lucide-react";

interface HeaderDropdownProps {
  columnKey: string;
  onRename: (oldKey: string, newKey: string) => void;
  onDelete: (columnKey: string) => void;
  setColumnOrder: React.Dispatch<React.SetStateAction<string[]>>;
}

export function HeaderDropdown({
  columnKey,
  onRename,
  onDelete,
  setColumnOrder,
}: HeaderDropdownProps) {
  const [inputValue, setInputValue] = useState(sentenceCase(columnKey));

  const validateAndRename = () => {
    const newKey = camelCase(inputValue);
    if (newKey !== columnKey && newKey.trim() !== "") {
      // Update column order to replace old key with new key
      setColumnOrder((prev) =>
        prev.map((id) => (id === columnKey ? newKey : id))
      );
      // Call the rename callback for data updates
      onRename(columnKey, newKey);
    } else {
      // Reset to original display name if invalid or unchanged
      setInputValue(sentenceCase(columnKey));
    }
  };

  const handleInputBlur = () => {
    validateAndRename();
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      validateAndRename();
    } else if (e.key === "Escape") {
      e.preventDefault();
      // Reset to original display name without renaming
      setInputValue(sentenceCase(columnKey));
    }
  };

  const handleInputChange = (value: string) => {
    setInputValue(value);
  };

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="ghost" className="size-6 z-30">
          <EllipsisVerticalIcon className="size-3" />
          <span className="sr-only">Options</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <div className="p-1">
          <Input
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onBlur={handleInputBlur}
            onKeyDown={handleInputKeyDown}
            placeholder="Column name"
            className="mb-1"
          />
        </div>
        <DropdownMenuItem
          onClick={() => onDelete(columnKey)}
          className="text-destructive focus:text-destructive"
        >
          <Trash2Icon />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
