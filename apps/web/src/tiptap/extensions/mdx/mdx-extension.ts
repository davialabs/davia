import { Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { MdxNodeView } from "./mdx-node-view";

export const MdxExtension = Node.create({
  name: "mdxComponent",
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
        tag: "mdx-component",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "mdx-component",
      {
        "data-path": HTMLAttributes["data-path"],
      },
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MdxNodeView, {
      attrs: { contentEditable: "false" },
    });
  },
});
