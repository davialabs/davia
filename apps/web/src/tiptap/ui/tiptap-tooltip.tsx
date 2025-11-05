"use client";

import React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { parseShortcutKeys } from "@/tiptap/utils";

export const ShortcutDisplay: React.FC<{ shortcuts: string[] }> = ({
  shortcuts,
}) => {
  if (shortcuts.length === 0) return null;

  return (
    <div className="not-prose text-zinc-400 dark:text-zinc-600 ml-auto text-xs tracking-widest">
      {shortcuts.map((key, index) => (
        <React.Fragment key={index}>
          {index > 0 && <kbd>+</kbd>}
          <kbd>{key}</kbd>
        </React.Fragment>
      ))}
    </div>
  );
};

type TiptapTooltipProps = {
  content: string; // Or could be another React.ReactNode.
  children: React.ReactNode;
  shortcutKeys?: string; // String of shortcut keys to be parsed (e.g., "ctrl+shift+b")
};

export const TiptapTooltip = ({
  content,
  children,
  shortcutKeys,
}: TiptapTooltipProps) => {
  // Parse shortcutKeys if provided, otherwise use shortcuts array
  const parsedShortcuts = React.useMemo(
    () => (shortcutKeys ? parseShortcutKeys({ shortcutKeys }) : []),
    [shortcutKeys]
  );

  return (
    <Tooltip delayDuration={300}>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent>
        {content}
        <ShortcutDisplay shortcuts={parsedShortcuts} />
      </TooltipContent>
    </Tooltip>
  );
};
