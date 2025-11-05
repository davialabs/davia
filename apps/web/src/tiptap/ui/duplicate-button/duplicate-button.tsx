"use client";

import * as React from "react";

// --- Hooks ---
import { useTiptapEditor } from "@/tiptap/hooks/use-tiptap-editor";

// --- Tiptap UI ---
import { useDuplicate, type UseDuplicateConfig } from "./use-duplicate";

// --- UI Primitives ---
import { Button } from "@/components/ui/button";
import { TiptapTooltip } from "@/tiptap/ui/tiptap-tooltip";

export interface DuplicateButtonProps
  extends React.ComponentProps<"button">,
    UseDuplicateConfig {
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
 * Button component for duplicating a node in a Tiptap editor.
 *
 * For custom button implementations, use the `useDuplicate` hook instead.
 */
export function DuplicateButton({
  editor: providedEditor,
  text,
  hideWhenUnavailable = false,
  onDuplicated,
  ...buttonProps
}: DuplicateButtonProps) {
  const { editor } = useTiptapEditor(providedEditor);
  const { isVisible, handleDuplicate, label, Icon } = useDuplicate({
    editor,
    hideWhenUnavailable,
    onDuplicated,
  });

  if (!isVisible) {
    return null;
  }

  return (
    <TiptapTooltip content={label}>
      <Button
        variant="ghost"
        onClick={handleDuplicate}
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
