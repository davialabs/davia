"use client";

import * as React from "react";

// --- Hooks ---
import { useTiptapEditor } from "@/tiptap/hooks/use-tiptap-editor";

// --- Tiptap UI ---
import { useDeleteNode, type UseDeleteNodeConfig } from "./use-delete-node";

// --- UI Primitives ---
import { Button } from "@/components/ui/button";
import { TiptapTooltip } from "@/tiptap/ui/tiptap-tooltip";

export interface DeleteNodeButtonProps
  extends React.ComponentProps<"button">,
    UseDeleteNodeConfig {
  /**
   * Optional text to display alongside the icon.
   */
  text?: string;
  /**
   * Optional show shortcut keys in the button.
   * @default false
   */
  showShortcut?: boolean;
}

/**
 * Button component for deleting a node in a Tiptap editor.
 *
 * For custom button implementations, use the `useDeleteNode` hook instead.
 */
export function DeleteNodeButton({
  editor: providedEditor,
  text,
  hideWhenUnavailable = false,
  onDeleted,
  ...buttonProps
}: DeleteNodeButtonProps) {
  const { editor } = useTiptapEditor(providedEditor);
  const { isVisible, handleDeleteNode, label, Icon } = useDeleteNode({
    editor,
    hideWhenUnavailable,
    onDeleted,
  });

  if (!isVisible) {
    return null;
  }

  return (
    <TiptapTooltip content={label}>
      <Button
        variant="ghost"
        onClick={handleDeleteNode}
        size="icon"
        className="size-6"
        {...buttonProps}
      >
        <Icon className="size-3" />
        {text && <>{text}</>}
      </Button>
    </TiptapTooltip>
  );
}
