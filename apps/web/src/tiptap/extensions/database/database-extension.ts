import { Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { DatabaseNodeView } from "./database-node-view";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    databaseView: {
      /**
       * Insert a <database-view> node with a data-path
       */
      toggleDatabase: (attrs?: { dataPath: string }) => ReturnType;
    };
  }
}

export const DatabaseExtension = Node.create({
  name: "databaseView",
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
        tag: "database-view",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "database-view",
      {
        "data-path": HTMLAttributes["data-path"],
      },
    ];
  },

  addNodeView(this) {
    return ReactNodeViewRenderer(DatabaseNodeView, {
      attrs: { contentEditable: "false" },
    });
  },

  addCommands() {
    return {
      toggleDatabase:
        (attrs?: { dataPath: string }) =>
        ({ commands }) => {
          const path = attrs?.dataPath;
          if (!path) return false;
          return commands.insertContent({
            type: this.name,
            attrs: { "data-path": path },
          });
        },
    };
  },
});
