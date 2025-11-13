import { Node } from "@tiptap/core";

export const DiffOldExtension = Node.create({
  name: "diffOld",
  group: "block",
  content: "block+",
  draggable: false,

  parseHTML() {
    return [
      {
        tag: "diff-old",
      },
    ];
  },

  renderHTML() {
    return [
      "diff-old",
      {
        contentEditable: "false",
      },
      0,
    ];
  },
});
