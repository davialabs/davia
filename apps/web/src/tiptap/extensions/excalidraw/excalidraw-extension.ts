import { Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { ExcalidrawNodeView } from "./node-view";

export const ExcalidrawExtension = Node.create({
  name: "excalidraw",
  group: "block",
  content: "inline*",

  addAttributes() {
    return {
      "data-path": {
        default: null,
        parseHTML: (element: HTMLElement) =>
          element.getAttribute("data-path") || null,
        renderHTML: (attributes: Record<string, unknown>) => ({
          "data-path": attributes["data-path"] as string,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "excalidraw",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "excalidraw",
      {
        "data-path": HTMLAttributes["data-path"],
      },
    ];
  },

  addNodeView(this) {
    return ReactNodeViewRenderer(ExcalidrawNodeView, {
      attrs: { contentEditable: "false" },
    });
  },
});
