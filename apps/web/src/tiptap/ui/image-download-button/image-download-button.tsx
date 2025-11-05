"use client";

import * as React from "react";

// --- Hooks ---
import { useTiptapEditor } from "@/tiptap/hooks/use-tiptap-editor";

// --- Tiptap UI ---
import { useImageDownload, UseImageDownloadConfig } from "./use-image-download";

// --- UI Primitives ---
import { Button } from "@/components/ui/button";
import { TiptapTooltip } from "@/tiptap/ui/tiptap-tooltip";

export interface ImageDownloadButtonProps
  extends React.ComponentProps<"button">,
    UseImageDownloadConfig {
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
 * Button component for downloading images from a Tiptap editor.
 * Only appears when an image is selected in the editor.
 *
 * For custom button implementations, use the `useImageDownload` hook instead.
 */
export function ImageDownloadButton({
  editor: providedEditor,
  text,
  hideWhenUnavailable = false,
  onDownloaded,
  resolveFileUrl,
  ...buttonProps
}: ImageDownloadButtonProps) {
  const { editor } = useTiptapEditor(providedEditor);
  const { isVisible, canDownload, handleDownload, label, Icon } =
    useImageDownload({
      editor,
      hideWhenUnavailable,
      onDownloaded,
      resolveFileUrl,
    });

  if (!isVisible) {
    return null;
  }

  return (
    <TiptapTooltip content={label}>
      <Button
        className="size-6"
        size="icon"
        variant="ghost"
        disabled={!canDownload}
        onClick={handleDownload}
        {...buttonProps}
      >
        <Icon className="size-3" />
        {text && <>{text}</>}
      </Button>
    </TiptapTooltip>
  );
}
