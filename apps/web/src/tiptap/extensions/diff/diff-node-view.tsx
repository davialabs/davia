"use client";

import {
  NodeViewWrapper,
  NodeViewContent,
  type ReactNodeViewProps,
} from "@tiptap/react";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function DiffNodeView(props: ReactNodeViewProps) {
  const { editor, getPos } = props;

  const handleAccept = () => {
    if (typeof getPos === "function") {
      const pos = getPos();
      if (pos !== undefined) {
        editor.commands.acceptDiff(pos);
      }
    }
  };

  const handleReject = () => {
    if (typeof getPos === "function") {
      const pos = getPos();
      if (pos !== undefined) {
        editor.commands.rejectDiff(pos);
      }
    }
  };

  return (
    <NodeViewWrapper className="diff-container relative my-2 rounded-md border border-border">
      <NodeViewContent />
      <div className="absolute bottom-2 right-2 z-10 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleReject}
          className={cn(
            "h-7 px-2 text-xs",
            "bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40",
            "text-red-600 dark:text-red-400",
            "border-red-200 dark:border-red-800"
          )}
        >
          <X className="h-3 w-3 mr-1" />
          Reject
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleAccept}
          className={cn(
            "h-7 px-2 text-xs",
            "bg-green-50 hover:bg-green-100 dark:bg-green-950/20 dark:hover:bg-green-950/40",
            "text-green-600 dark:text-green-400",
            "border-green-200 dark:border-green-800"
          )}
        >
          <Check className="h-3 w-3 mr-1" />
          Accept
        </Button>
      </div>
    </NodeViewWrapper>
  );
}
