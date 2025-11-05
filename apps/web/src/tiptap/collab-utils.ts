import { NodeSelection, type Selection } from "@tiptap/pm/state";
import type { JSONContent, Editor } from "@tiptap/react";
import { isTextSelection, isNodeSelection, posToDOMRect } from "@tiptap/react";

const NODE_TYPE_LABELS: Record<string, string> = {
  paragraph: "Text",
  heading: "Heading",
  bulletList: "Bullet List",
  orderedList: "Numbered List",
  taskList: "Task List",
  blockquote: "Quote",
  codeBlock: "Code Block",
  image: "Image",
  imageUpload: "Image Upload",
  horizontalRule: "Horizontal Rule",
  mdxComponent: "Component",
  databaseView: "Database",
};
export type OverflowPosition = "none" | "top" | "bottom" | "both";

/**
 * Returns a display name for the current node in the editor
 * @param editor The Tiptap editor instance
 * @returns The display name of the current node
 */
export const getNodeDisplayName = (editor: Editor | null): string => {
  if (!editor) return "Node";

  const { selection } = editor.state;

  if (selection instanceof NodeSelection) {
    const nodeType = selection.node.type.name;
    return NODE_TYPE_LABELS[nodeType] || nodeType.toLowerCase();
  }

  const { $anchor } = selection;
  const nodeType = $anchor.parent.type.name;
  return NODE_TYPE_LABELS[nodeType] || nodeType.toLowerCase();
};

/**
 * Removes empty paragraph nodes from content
 */
export const removeEmptyParagraphs = (content: JSONContent) => ({
  ...content,
  content: content.content?.filter(
    (node) =>
      node.type !== "paragraph" ||
      node.content?.some((child) => child.text?.trim() || child.type !== "text")
  ),
});

/**
 * Determines how a target element overflows relative to a container element
 */
export function getElementOverflowPosition(
  targetElement: Element,
  containerElement: HTMLElement
): OverflowPosition {
  const targetBounds = targetElement.getBoundingClientRect();
  const containerBounds = containerElement.getBoundingClientRect();

  const isOverflowingTop = targetBounds.top < containerBounds.top;
  const isOverflowingBottom = targetBounds.bottom > containerBounds.bottom;

  if (isOverflowingTop && isOverflowingBottom) return "both";
  if (isOverflowingTop) return "top";
  if (isOverflowingBottom) return "bottom";
  return "none";
}

/**
 * Checks if the current selection is valid for a given editor
 */
export const isSelectionValid = (
  editor: Editor | null,
  selection?: Selection,
  excludedNodeTypes: string[] = ["imageUpload", "horizontalRule"]
): boolean => {
  if (!editor) return false;
  if (!selection) selection = editor.state.selection;

  const { state } = editor;
  const { doc } = state;
  const { empty, from, to } = selection;

  const isEmptyTextBlock =
    !doc.textBetween(from, to).length && isTextSelection(selection);
  const isCodeBlock =
    selection.$from.parent.type.spec.code ||
    (isNodeSelection(selection) && selection.node.type.spec.code);
  const isExcludedNode =
    isNodeSelection(selection) &&
    excludedNodeTypes.includes(selection.node.type.name);

  return !empty && !isEmptyTextBlock && !isCodeBlock && !isExcludedNode;
};

/**
 * Checks if the current text selection is valid for editing
 * - Not empty
 * - Not a code block
 * - Not a node selection
 */
export const isTextSelectionValid = (editor: Editor | null): boolean => {
  if (!editor) return false;
  const { state } = editor;
  const { selection } = state;
  const isValid =
    isTextSelection(selection) &&
    !selection.empty &&
    !selection.$from.parent.type.spec.code &&
    !isNodeSelection(selection);

  return isValid;
};

/**
 * Gets the bounding rect of the current selection in the editor.
 */
export const getSelectionBoundingRect = (editor: Editor): DOMRect | null => {
  const { state } = editor.view;
  const { selection } = state;
  const { ranges } = selection;

  const from = Math.min(...ranges.map((range) => range.$from.pos));
  const to = Math.max(...ranges.map((range) => range.$to.pos));

  if (isNodeSelection(selection)) {
    const node = editor.view.nodeDOM(from) as HTMLElement;
    if (node) {
      return node.getBoundingClientRect();
    }
  }

  return posToDOMRect(editor.view, from, to);
};

/**
 * Generates a deterministic avatar URL from a user name
 */
export const getAvatar = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash;
  }

  const randomFraction = (Math.abs(hash) % 1000000) / 1000000;
  const id = 1 + Math.floor(randomFraction * 20);
  const idString = id.toString().padStart(2, "0");
  return `/avatars/memoji_${idString}.png`;
};

/**
 * Returns a deterministic hex color from a seed.
 * If no seed is provided, a random color is returned.
 * Returns 6-digit hex colors compatible with y-tiptap collaboration carets.
 */
export const getRandomColor = (seed?: string) => {
  const palette = [
    "#06b6d4", // cyan-500
    "#0ea5e9", // sky-500
    "#3b82f6", // blue-500
    "#6366f1", // indigo-500
    "#8b5cf6", // violet-500
    "#a855f7", // purple-500
    "#d946ef", // fuchsia-500
    "#ec4899", // pink-500
    "#f43f5e", // rose-500
    "#f97316", // orange-500
    "#f59e0b", // amber-500
    "#84cc16", // lime-500
    "#10b981", // emerald-500
    "#14b8a6", // teal-500
  ];

  if (!seed) {
    return palette[Math.floor(Math.random() * palette.length)];
  }

  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash;
  }
  const index = Math.abs(hash) % palette.length;
  return palette[index];
};
