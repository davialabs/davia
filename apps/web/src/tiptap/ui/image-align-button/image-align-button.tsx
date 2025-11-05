"use client";

import * as React from "react";

// --- Hooks ---
import { useTiptapEditor } from "@/tiptap/hooks/use-tiptap-editor";

// --- Tiptap UI ---
import { useImageAlign, type UseImageAlignConfig } from "./use-image-align";

// --- UI Primitives ---
import { Button } from "@/components/ui/button";
import { TiptapTooltip } from "@/tiptap/ui/tiptap-tooltip";

export interface ImageAlignButtonProps
  extends React.ComponentProps<"button">,
    UseImageAlignConfig {
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
 * Button component for setting image alignment in a Tiptap editor.
 *
 * For custom button implementations, use the `useImageAlign` hook instead.
 */
export function ImageAlignButton({
  editor: providedEditor,
  align,
  text,
  extensionName,
  attributeName = "data-align",
  hideWhenUnavailable = false,
  onAligned,
  ...buttonProps
}: ImageAlignButtonProps) {
  const { editor } = useTiptapEditor(providedEditor);
  const { isVisible, handleImageAlign, label, canAlign, isActive, Icon } =
    useImageAlign({
      editor,
      align,
      extensionName,
      attributeName,
      hideWhenUnavailable,
      onAligned,
    });

  if (!isVisible) {
    return null;
  }

  return (
    <TiptapTooltip content={label}>
      <Button
        className="size-6"
        size="icon"
        variant={isActive ? "outline" : "ghost"}
        disabled={!canAlign}
        onClick={handleImageAlign}
        {...buttonProps}
      >
        <Icon className="size-3" />
        {text && <>{text}</>}
      </Button>
    </TiptapTooltip>
  );
}
