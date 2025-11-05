"use client";

import * as React from "react";

// --- Hooks ---
import { useTiptapEditor } from "@/tiptap/hooks/use-tiptap-editor";

// --- Tiptap UI ---
import {
  useResetAllFormatting,
  type UseResetAllFormattingConfig,
} from "./use-reset-all-formatting";

// --- UI Primitives ---
import { Button } from "@/components/ui/button";
import { TiptapTooltip } from "@/tiptap/ui/tiptap-tooltip";

export interface ResetAllFormattingButtonProps
  extends React.ComponentProps<"button">,
    UseResetAllFormattingConfig {
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
 * Button component for resetting formatting of a node in a Tiptap editor.
 * Removes all marks and converts non-paragraph nodes to paragraphs.
 *
 * For custom button implementations, use the `useResetAllFormatting` hook instead.
 */
export function ResetAllFormattingButton({
  editor: providedEditor,
  text,
  hideWhenUnavailable = false,
  preserveMarks = ["inlineThread"],
  onResetAllFormatting,
  ...buttonProps
}: ResetAllFormattingButtonProps) {
  const { editor } = useTiptapEditor(providedEditor);
  const { isVisible, canReset, handleResetFormatting, label, Icon } =
    useResetAllFormatting({
      editor,
      preserveMarks,
      hideWhenUnavailable,
      onResetAllFormatting,
    });

  if (!isVisible) {
    return null;
  }

  return (
    <TiptapTooltip content={label}>
      <Button
        variant="ghost"
        onClick={handleResetFormatting}
        disabled={!canReset}
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
