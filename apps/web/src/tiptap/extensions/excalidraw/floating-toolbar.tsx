import type { Editor } from "@tiptap/react";
import { Maximize2 } from "lucide-react";

// --- Hooks ---
import { useTiptapEditor } from "../../hooks/use-tiptap-editor";

// --- UI ---
import { Button } from "@/components/ui/button";
import { TiptapTooltip } from "@/tiptap/ui/tiptap-tooltip";

export function FloatingToolbar({
  editor: providedEditor,
  onFullscreenClick,
}: {
  editor?: Editor | null;
  onFullscreenClick?: () => void;
}) {
  const { editor } = useTiptapEditor(providedEditor);

  if (!editor) {
    return null;
  }

  return (
    <div className="flex items-center gap-0.5 w-fit p-1 overflow-hidden rounded-md bg-background/90 shadow-sm">
      <TiptapTooltip content="Full screen">
        <Button
          variant="ghost"
          size="icon"
          className="size-6"
          onClick={onFullscreenClick}
        >
          <Maximize2 className="size-3" />
        </Button>
      </TiptapTooltip>
    </div>
  );
}
