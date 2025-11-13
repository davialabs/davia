import { Node } from "@tiptap/core";

export const DiffNewExtension = Node.create({
  name: "diffNew",
  group: "block",
  content: "block+",
  draggable: false,

  parseHTML() {
    return [
      {
        tag: "diff-new",
      },
    ];
  },

  renderHTML() {
    return ["diff-new", 0];
  },
});
