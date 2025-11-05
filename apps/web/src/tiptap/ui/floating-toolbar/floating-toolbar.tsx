"use client";

// --- Hooks ---
import { useTiptapEditor } from "@/tiptap/hooks/use-tiptap-editor";
import { useUiEditorState } from "@/tiptap/hooks/use-ui-editor-state";
import { useFloatingToolbarVisibility } from "@/tiptap/hooks/use-floating-toolbar-visibility";
import { useIsMobile } from "@/hooks/use-mobile";

// --- Utils ---
import { isSelectionValid } from "@/tiptap/collab-utils";
import { isNodeTypeSelected } from "@/tiptap/utils";

// --- UI ---
import { FloatingElement } from "@/tiptap/ui-utils/floating-element";
import { TurnIntoPopover } from "./turn-into-popover";
import { MarkButton } from "./mark-button";
import { LinkPopover } from "./link-popover";

export function FloatingToolbar() {
  const { editor } = useTiptapEditor();
  const isMobile = useIsMobile();
  const isImageNodeSelected = isNodeTypeSelected(editor, ["image"]);
  const isMdxNodeSelected = isNodeTypeSelected(editor, ["mdxComponent"]);
  const isDatabaseNodeSelected = isNodeTypeSelected(editor, ["databaseView"]);
  const { lockDragHandle } = useUiEditorState(editor);
  const { shouldShow } = useFloatingToolbarVisibility({
    editor,
    isSelectionValid,
    extraHideWhen:
      isImageNodeSelected || isMdxNodeSelected || isDatabaseNodeSelected, // TODO: Add extra hide when AI space menu is visible
  });

  if (lockDragHandle || isMobile) return null;

  return (
    <FloatingElement shouldShow={shouldShow}>
      <div className="flex items-center gap-0.5 w-fit p-1 overflow-hidden rounded-md border border-muted bg-background shadow-md">
        <TurnIntoPopover editor={editor!} />
        <MarkButton type="bold" hideWhenUnavailable={true} />
        <MarkButton type="italic" hideWhenUnavailable={true} />
        <MarkButton type="underline" hideWhenUnavailable={true} />
        <MarkButton type="strike" hideWhenUnavailable={true} />
        <MarkButton type="code" hideWhenUnavailable={true} />
        <LinkPopover />
      </div>
    </FloatingElement>
  );
}
