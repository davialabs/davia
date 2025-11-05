import { Extension, isNodeEmpty } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

// Standalone placeholder for the `title` node only, with its own PluginKey
// so it can coexist with the default Placeholder extension.
export const TitlePlaceholder = Extension.create({
  name: "titlePlaceholder",

  addOptions() {
    return {
      placeholder: "New page",
    } as { placeholder: string };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("placeholder-title"),
        props: {
          decorations: ({ doc, selection }) => {
            const active = this.editor.isEditable;
            const { anchor } = selection;
            const decorations: Decoration[] = [];

            if (!active) return null;

            doc.descendants((node, pos) => {
              // Only act on first h1 heading at the root
              const isHeading =
                node.type.name === "heading" && node.attrs?.level === 1;
              const isAtDocRoot = pos === 0; // first block in document
              if (!isHeading || !isAtDocRoot) return false;

              const hasAnchor = anchor >= pos && anchor <= pos + node.nodeSize;
              const isEmpty = !node.isLeaf && isNodeEmpty(node);

              // Show regardless of focus; mimic showOnlyCurrent=false for title only
              if ((hasAnchor || true) && isEmpty) {
                const text = this.options.placeholder as string;
                const deco = Decoration.node(pos, pos + node.nodeSize, {
                  class: "is-empty-title",
                  "data-placeholder": text,
                });

                decorations.push(deco);
              }

              return false; // do not include children
            });

            return DecorationSet.create(doc, decorations);
          },
        },
      }),
    ];
  },
});
