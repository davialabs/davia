"use client";

import * as React from "react";

// --- Hooks ---
import { useTiptapEditor } from "@/tiptap/hooks/use-tiptap-editor";

// --- Icons ---
import { ChevronDownIcon, CornerDownLeftIcon, TrashIcon } from "lucide-react";

// --- Tiptap UI ---
import { useLinkPopover, type UseLinkPopoverConfig } from "./use-link-popover";

// --- UI Primitives ---
import { Button } from "@/components/ui/button";
import { TiptapTooltip } from "@/tiptap/ui/tiptap-tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

export interface LinkMainProps {
  /**
   * The URL to set for the link.
   */
  url: string;
  /**
   * Function to update the URL state.
   */
  setUrl: React.Dispatch<React.SetStateAction<string | null>>;
  /**
   * Function to set the link in the editor.
   */
  setLink: () => void;
  /**
   * Function to remove the link from the editor.
   */
  removeLink: () => void;
  /**
   * Function to open the link.
   */
  openLink: () => void;
  /**
   * Whether the link is currently active in the editor.
   */
  isActive: boolean;
}

export interface LinkPopoverProps
  extends React.ComponentProps<"button">,
    UseLinkPopoverConfig {
  /**
   * Callback for when the popover opens or closes.
   */
  onOpenChange?: (isOpen: boolean) => void;
  /**
   * Whether to automatically open the popover when a link is active.
   * @default true
   */
  autoOpenOnLinkActive?: boolean;
}

/**
 * Link popover component for Tiptap editors.
 *
 * For custom popover implementations, use the `useLinkPopover` hook instead.
 */
export function LinkPopover({
  editor: providedEditor,
  hideWhenUnavailable = false,
  onSetLink,
  onOpenChange,
  ...buttonProps
}: LinkPopoverProps) {
  const { editor } = useTiptapEditor(providedEditor);
  const [isOpen, setIsOpen] = React.useState(false);

  const {
    isVisible,
    canSet,
    isActive,
    url,
    setUrl,
    setLink,
    removeLink,
    label,
    Icon,
  } = useLinkPopover({
    editor,
    hideWhenUnavailable,
    onSetLink,
  });

  const handleOnOpenChange = React.useCallback(
    (nextIsOpen: boolean) => {
      setIsOpen(nextIsOpen);
      onOpenChange?.(nextIsOpen);
    },
    [onOpenChange]
  );

  const handleSetLink = React.useCallback(() => {
    setLink();
    setIsOpen(false);
  }, [setLink]);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleSetLink();
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <Popover modal open={isOpen} onOpenChange={handleOnOpenChange}>
      <TiptapTooltip content={label}>
        <PopoverTrigger asChild>
          <Button
            className="h-7 has-[>svg]:px-2"
            size="sm"
            variant={isActive ? "outline" : "ghost"}
            disabled={!canSet}
            {...buttonProps}
          >
            <Icon className="size-3.5" />
            <ChevronDownIcon className="size-3" />
          </Button>
        </PopoverTrigger>
      </TiptapTooltip>

      <PopoverContent className="p-2 flex gap-1 items-center">
        <Input
          type="url"
          placeholder="Paste a link..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          className="h-7 mr-1"
        />
        <TiptapTooltip content="Apply link">
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={setLink}
            title="Apply link"
            disabled={!url && !isActive}
          >
            <CornerDownLeftIcon className="size-3.5" />
          </Button>
        </TiptapTooltip>
        <TiptapTooltip content="Remove link">
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={removeLink}
            title="Remove link"
            disabled={!url && !isActive}
          >
            <TrashIcon className="size-3.5" />
          </Button>
        </TiptapTooltip>
      </PopoverContent>
    </Popover>
  );
}
