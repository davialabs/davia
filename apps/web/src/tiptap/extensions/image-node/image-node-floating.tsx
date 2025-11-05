import type { Editor } from "@tiptap/react";

// --- Hooks ---
import { useTiptapEditor } from "../../hooks/use-tiptap-editor";

// --- Lib ---
import { isNodeTypeSelected } from "@/tiptap/utils";

// --- Tiptap UI ---
import { ImageAlignButton } from "../../ui/image-align-button";
import { ImageDownloadButton } from "../../ui/image-download-button";
import { DeleteNodeButton } from "../../ui/delete-node-button";

export function ImageNodeFloating({
  editor: providedEditor,
}: {
  editor?: Editor | null;
}) {
  const { editor } = useTiptapEditor(providedEditor);
  const visible = isNodeTypeSelected(editor, ["image"]);

  if (!editor || !visible) {
    return null;
  }

  return (
    <div className="flex items-center gap-0.5 w-fit p-1 overflow-hidden rounded-md bg-background/90 shadow-sm">
      <ImageAlignButton align="left" />
      <ImageAlignButton align="center" />
      <ImageAlignButton align="right" />
      <ImageDownloadButton />
      <DeleteNodeButton />
    </div>
  );
}
