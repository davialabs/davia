import { Button, buttonVariants } from "@/components/ui/button";
import type { VariantProps } from "class-variance-authority";
import { Plus } from "lucide-react";

export function AddRow({
  onAddRow,
  title,
  variant,
}: {
  onAddRow: () => void;
  title: string;
  variant: VariantProps<typeof buttonVariants>["variant"];
}) {
  return (
    <Button variant={variant} size="sm" onClick={onAddRow}>
      <Plus />
      {title}
    </Button>
  );
}
