import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface DeleteRowsProps {
  onDeleteRows: () => void;
}

export function DeleteRows({ onDeleteRows }: DeleteRowsProps) {
  return (
    <Button variant="outline" size="icon-sm" onClick={onDeleteRows}>
      <Trash2 />
      <span className="sr-only">Delete selected rows</span>
    </Button>
  );
}
