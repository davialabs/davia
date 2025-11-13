import { Node } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Fragment, Node as ProseMirrorNode } from "@tiptap/pm/model";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { DiffNodeView } from "./diff-node-view";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    diff: {
      /**
       * Accept a single diff (keeps diff-new, removes diff-old)
       */
      acceptDiff: (pos?: number) => ReturnType;
      /**
       * Reject a single diff (keeps diff-old, removes diff-new)
       */
      rejectDiff: (pos?: number) => ReturnType;
      /**
       * Accept all diffs in document
       */
      acceptAllPageDiffs: () => ReturnType;
      /**
       * Reject all diffs in document
       */
      rejectAllPageDiffs: () => ReturnType;
    };
  }

  interface Storage {
    diff: {
      hasPageDiffs: boolean;
    };
  }
}

export const DiffExtension = Node.create({
  name: "diff",
  group: "block",
  content: "diffOld? diffNew?",
  defining: true,
  selectable: false,

  addStorage() {
    return {
      diff: {
        hasPageDiffs: false,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "diff",
      },
    ];
  },

  renderHTML() {
    return ["diff", 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(DiffNodeView);
  },

  addCommands() {
    return {
      acceptDiff:
        (pos?: number) =>
        ({ tr, state, dispatch }) => {
          const { doc, selection } = state;
          const position = pos !== undefined ? pos : selection.$from.pos;

          // Find diff node at position
          let diffNodePos: number | null = null;
          let diffNode: ProseMirrorNode | null = null;

          doc.nodesBetween(
            Math.max(0, position - 1),
            position + 1,
            (node, nodePos) => {
              if (node.type.name === "diff") {
                diffNodePos = nodePos;
                diffNode = node;
                return false;
              }
            }
          );

          if (!dispatch || !diffNode || diffNodePos === null) {
            return false;
          }

          // At this point, we know diffNode and diffNodePos are non-null
          // TypeScript has trouble narrowing types from callbacks, so we assert
          const foundNode = diffNode as ProseMirrorNode;
          const foundPos = diffNodePos as number;

          // Find diff-new child in the content
          let diffNewContent: Fragment | null = null;
          foundNode.content.forEach((child: ProseMirrorNode) => {
            if (child.type.name === "diffNew") {
              diffNewContent = child.content;
            }
          });

          if (diffNewContent) {
            // Replace diff with diff-new content
            tr.replaceWith(
              foundPos,
              foundPos + foundNode.nodeSize,
              diffNewContent
            );
          } else {
            // No diff-new, remove entire diff
            tr.delete(foundPos, foundPos + foundNode.nodeSize);
          }

          dispatch(tr);
          return true;
        },

      rejectDiff:
        (pos?: number) =>
        ({ tr, state, dispatch }) => {
          const { doc, selection } = state;
          const position = pos !== undefined ? pos : selection.$from.pos;

          // Find diff node at position
          let diffNodePos: number | null = null;
          let diffNode: ProseMirrorNode | null = null;

          doc.nodesBetween(
            Math.max(0, position - 1),
            position + 1,
            (node, nodePos) => {
              if (node.type.name === "diff") {
                diffNodePos = nodePos;
                diffNode = node;
                return false;
              }
            }
          );

          if (!dispatch || !diffNode || diffNodePos === null) {
            return false;
          }

          // At this point, we know diffNode and diffNodePos are non-null
          // TypeScript has trouble narrowing types from callbacks, so we assert
          const foundNode = diffNode as ProseMirrorNode;
          const foundPos = diffNodePos as number;

          // Find diff-old child in the content
          let diffOldContent: Fragment | null = null;
          foundNode.content.forEach((child: ProseMirrorNode) => {
            if (child.type.name === "diffOld") {
              diffOldContent = child.content;
            }
          });

          if (diffOldContent) {
            // Replace diff with diff-old content
            tr.replaceWith(
              foundPos,
              foundPos + foundNode.nodeSize,
              diffOldContent
            );
          } else {
            // No diff-old, remove entire diff
            tr.delete(foundPos, foundPos + foundNode.nodeSize);
          }

          dispatch(tr);
          return true;
        },

      acceptAllPageDiffs:
        () =>
        ({ tr, state, dispatch }) => {
          const { doc } = state;
          const diffs: Array<{ pos: number; node: ProseMirrorNode }> = [];

          // Find all diff nodes
          doc.descendants((node, nodePos) => {
            if (node.type.name === "diff") {
              diffs.push({ pos: nodePos, node });
            }
          });

          if (diffs.length === 0 || !dispatch) {
            return false;
          }

          // Process in reverse order to maintain positions
          diffs.reverse().forEach(({ pos, node }) => {
            // Find diff-new child
            let found = false;
            node.content.forEach((child: ProseMirrorNode) => {
              if (child.type.name === "diffNew" && !found) {
                tr.replaceWith(pos, pos + node.nodeSize, child.content);
                found = true;
              }
            });
            if (!found) {
              tr.delete(pos, pos + node.nodeSize);
            }
          });

          dispatch(tr);
          return true;
        },

      rejectAllPageDiffs:
        () =>
        ({ tr, state, dispatch }) => {
          const { doc } = state;
          const diffs: Array<{ pos: number; node: ProseMirrorNode }> = [];

          // Find all diff nodes
          doc.descendants((node, nodePos) => {
            if (node.type.name === "diff") {
              diffs.push({ pos: nodePos, node });
            }
          });

          if (diffs.length === 0 || !dispatch) {
            return false;
          }

          // Process in reverse order to maintain positions
          diffs.reverse().forEach(({ pos, node }) => {
            // Find diff-old child
            let found = false;
            node.content.forEach((child: ProseMirrorNode) => {
              if (child.type.name === "diffOld" && !found) {
                tr.replaceWith(pos, pos + node.nodeSize, child.content);
                found = true;
              }
            });
            if (!found) {
              tr.delete(pos, pos + node.nodeSize);
            }
          });

          dispatch(tr);
          return true;
        },
    };
  },

  addProseMirrorPlugins() {
    const extension = this;
    return [
      // Plugin to update hasPageDiffs storage
      new Plugin({
        key: new PluginKey("diff-storage"),
        appendTransaction(transactions, oldState, newState) {
          // Check if document has diff nodes
          let hasDiffs = false;
          newState.doc.descendants((node) => {
            if (node.type.name === "diff") {
              hasDiffs = true;
              return false;
            }
          });

          // Update storage if changed
          if (extension.storage.diff.hasPageDiffs !== hasDiffs) {
            extension.storage.diff.hasPageDiffs = hasDiffs;
          }

          return null;
        },
      }),

      // Plugin to remove empty diff nodes
      new Plugin({
        key: new PluginKey("diff-cleanup"),
        appendTransaction: (transactions, oldState, newState) => {
          const tr = newState.tr;
          const diffs: Array<{ pos: number }> = [];

          // Find all empty diff nodes
          newState.doc.descendants((node, nodePos) => {
            if (node.type.name === "diff" && node.content.size === 0) {
              diffs.push({ pos: nodePos });
            }
          });

          if (diffs.length === 0) {
            return null;
          }

          // Remove empty diff nodes in reverse order
          diffs.reverse().forEach(({ pos }) => {
            const node = newState.doc.nodeAt(pos);
            if (node) {
              tr.delete(pos, pos + node.nodeSize);
            }
          });

          return tr;
        },
      }),
    ];
  },
});
