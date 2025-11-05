"use client";

import * as React from "react";
import { flip, offset, shift, size } from "@floating-ui/react";
import { PluginKey } from "@tiptap/pm/state";

// --- Hooks ---
import { useFloatingElement } from "@/tiptap/hooks/use-floating-element";
import { useMenuNavigation } from "@/tiptap/hooks/use-menu-navigation";
import { useTiptapEditor } from "@/tiptap/hooks/use-tiptap-editor";

// --- Tiptap Editor ---
import type { Range } from "@tiptap/react";

// --- Tiptap UI ---
import { Suggestion } from "@tiptap/suggestion";

// --- UI Primitives ---
import {
  SuggestionPluginKey,
  type SuggestionKeyDownProps,
  type SuggestionProps,
} from "@tiptap/suggestion";

import {
  calculateStartPosition,
  type SuggestionItem,
  type SuggestionMenuProps,
} from "@/tiptap/ui-utils/suggestion-menu";

import type { Editor } from "@tiptap/react";

/**
 * Checks if the current node is empty (has no content) or only contains the trigger character.
 *
 * @param editor The Tiptap editor instance
 * @param triggerChar The trigger character (e.g., "/")
 * @returns true if the current node is empty or only contains trigger + query, false otherwise
 */
function isCurrentNodeEmpty(
  editor: Editor,
  triggerChar: string = "/"
): boolean {
  const { state } = editor;
  const { selection } = state;
  const { $from } = selection;

  // Get the current node
  const currentNode = $from.parent;
  const textContent = currentNode.textContent || "";

  // Node is considered "empty" if:
  // 1. It has no content
  // 2. It only contains whitespace
  // 3. It only contains the trigger character and optional query text
  if (!textContent || textContent.trim() === "") {
    return true;
  }

  // Check if the content only starts with the trigger character
  // This allows for the slash + query text (e.g., "/hea" for "heading")
  const trimmedContent = textContent.trim();
  if (trimmedContent.startsWith(triggerChar)) {
    // Check if this is the only content in the node (no other text before or after)
    const beforeTrigger = textContent.substring(
      0,
      textContent.indexOf(triggerChar)
    );
    return !beforeTrigger.trim();
  }

  return false;
}

/**
 * A component that renders a suggestion menu for Tiptap editors that only triggers when the current node is empty.
 * Displays a floating menu when a trigger character is typed in an empty node.
 */
export const EmptyNodeSuggestionMenu = ({
  editor: providedEditor,
  floatingOptions,
  selector = "tiptap-suggestion-menu",
  children,
  maxHeight = 384,
  pluginKey = SuggestionPluginKey,
  ...internalSuggestionProps
}: SuggestionMenuProps) => {
  const { editor } = useTiptapEditor(providedEditor);

  const [show, setShow] = React.useState<boolean>(false);
  const [internalClientRect, setInternalClientRect] =
    React.useState<DOMRect | null>(null);
  const [internalCommand, setInternalCommand] = React.useState<
    ((item: SuggestionItem) => void) | null
  >(null);
  const [internalItems, setInternalItems] = React.useState<SuggestionItem[]>(
    []
  );
  const [internalQuery, setInternalQuery] = React.useState<string>("");
  const [, setInternalRange] = React.useState<Range | null>(null);

  const { ref, style, getFloatingProps, isMounted } = useFloatingElement(
    show,
    internalClientRect,
    1000,
    {
      placement: "bottom-start",
      middleware: [
        offset(10),
        flip({
          mainAxis: true,
          crossAxis: false,
        }),
        shift(),
        size({
          apply({ availableHeight, elements }) {
            if (elements.floating) {
              const maxHeightValue = maxHeight
                ? Math.min(maxHeight, availableHeight)
                : availableHeight;

              elements.floating.style.setProperty(
                "--suggestion-menu-max-height",
                `${maxHeightValue}px`
              );
            }
          },
        }),
      ],
      onOpenChange(open) {
        if (!open) {
          setShow(false);
        }
      },
      ...floatingOptions,
    }
  );

  const internalSuggestionPropsRef = React.useRef(internalSuggestionProps);

  React.useEffect(() => {
    internalSuggestionPropsRef.current = internalSuggestionProps;
  }, [internalSuggestionProps]);

  const closePopup = React.useCallback(() => {
    setShow(false);
  }, []);

  React.useEffect(() => {
    if (!editor || editor.isDestroyed) {
      return;
    }

    const existingPlugin = editor.state.plugins.find(
      (plugin) => plugin.spec.key === pluginKey
    );
    if (existingPlugin) {
      editor.unregisterPlugin(pluginKey);
    }

    const suggestion = Suggestion({
      pluginKey:
        pluginKey instanceof PluginKey ? pluginKey : new PluginKey(pluginKey),
      editor,

      // Custom allow function to only trigger when the current node is empty
      allow: ({ editor }) => {
        return isCurrentNodeEmpty(
          editor,
          internalSuggestionPropsRef.current.char
        );
      },

      command({ editor, range, props }) {
        if (!range) {
          return;
        }

        const { view, state } = editor;
        const { selection } = state;

        const isMention = editor.extensionManager.extensions.some(
          (extension) => {
            const name = extension.name;
            return (
              name === "mention" &&
              extension.options?.suggestion?.char ===
                internalSuggestionPropsRef.current.char
            );
          }
        );

        if (!isMention) {
          const cursorPosition = selection.$from.pos;
          const previousNode = selection.$head?.nodeBefore;

          const startPosition = previousNode
            ? calculateStartPosition(
                cursorPosition,
                previousNode,
                internalSuggestionPropsRef.current.char
              )
            : selection.$from.start();

          const transaction = state.tr.deleteRange(
            startPosition,
            cursorPosition
          );
          view.dispatch(transaction);
        }

        const nodeAfter = view.state.selection.$to.nodeAfter;
        const overrideSpace = nodeAfter?.text?.startsWith(" ");

        const rangeToUse = { ...range };

        if (overrideSpace) {
          rangeToUse.to += 1;
        }

        props.onSelect({ editor, range: rangeToUse, context: props.context });
      },

      render: () => {
        return {
          onStart: (props: SuggestionProps<SuggestionItem>) => {
            // Double-check that the node is empty before showing
            if (
              !isCurrentNodeEmpty(
                props.editor,
                internalSuggestionPropsRef.current.char
              )
            ) {
              return;
            }

            setInternalCommand(() => props.command);
            setInternalItems(props.items);
            setInternalQuery(props.query);
            setInternalRange(props.range);
            setInternalClientRect(props.clientRect?.() ?? null);
            setShow(true);
          },

          onUpdate: (props: SuggestionProps<SuggestionItem>) => {
            // Double-check that the node is empty before updating
            if (
              !isCurrentNodeEmpty(
                props.editor,
                internalSuggestionPropsRef.current.char
              )
            ) {
              setShow(false);
              return;
            }

            setInternalCommand(() => props.command);
            setInternalItems(props.items);
            setInternalQuery(props.query);
            setInternalRange(props.range);
            setInternalClientRect(props.clientRect?.() ?? null);
          },

          onKeyDown: (props: SuggestionKeyDownProps) => {
            if (props.event.key === "Escape") {
              closePopup();
              return true;
            }
            return false;
          },

          onExit: () => {
            setInternalCommand(null);
            setInternalItems([]);
            setInternalQuery("");
            setInternalRange(null);
            setInternalClientRect(null);
            setShow(false);
          },
        };
      },
      ...internalSuggestionPropsRef.current,
    });

    editor.registerPlugin(suggestion);

    return () => {
      if (!editor.isDestroyed) {
        editor.unregisterPlugin(pluginKey);
      }
    };
  }, [editor, pluginKey, closePopup]);

  const onSelect = React.useCallback(
    (item: SuggestionItem) => {
      closePopup();

      if (internalCommand) {
        internalCommand(item);
      }
    },
    [closePopup, internalCommand]
  );

  const { selectedIndex } = useMenuNavigation({
    editor: editor,
    query: internalQuery,
    items: internalItems,
    onSelect,
  });

  if (!isMounted || !show || !editor) {
    return null;
  }

  return (
    <div
      ref={ref}
      style={style}
      {...getFloatingProps()}
      data-selector={selector}
      className="tiptap-suggestion-menu"
      role="listbox"
      aria-label="Suggestions"
      onPointerDown={(e) => e.preventDefault()}
    >
      {children({
        items: internalItems,
        selectedIndex,
        onSelect,
      })}
    </div>
  );
};
