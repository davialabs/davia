"use client";

import * as React from "react";

// --- Hooks ---
import { useTiptapEditor } from "@/tiptap/hooks/use-tiptap-editor";

// --- Tiptap UI ---
import { useMark, type UseMarkConfig } from "./use-mark";

// --- UI Primitives ---
import { Button } from "@/components/ui/button";
import { TiptapTooltip } from "@/tiptap/ui/tiptap-tooltip";

export interface MarkButtonProps
  extends Omit<React.ComponentProps<"button">, "type">,
    UseMarkConfig {
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
 * Button component for toggling marks in a Tiptap editor.
 *
 * For custom button implementations, use the `useMark` hook instead.
 */
export function MarkButton({
  editor: providedEditor,
  type,
  text,
  hideWhenUnavailable = false,
  onToggled,
  ...buttonProps
}: MarkButtonProps) {
  const { editor } = useTiptapEditor(providedEditor);
  const {
    isVisible,
    handleMark,
    label,
    canToggle,
    isActive,
    Icon,
    shortcutKeys,
  } = useMark({
    editor,
    type,
    hideWhenUnavailable,
    onToggled,
  });

  if (!isVisible) {
    return null;
  }

  return (
    <TiptapTooltip content={label} shortcutKeys={shortcutKeys}>
      <Button
        className="size-7"
        size="icon"
        variant={isActive ? "outline" : "ghost"}
        disabled={!canToggle}
        onClick={handleMark}
        {...buttonProps}
      >
        <Icon className="size-3.5" />
        {text && <>{text}</>}
      </Button>
    </TiptapTooltip>
  );
}
