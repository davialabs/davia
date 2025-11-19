import { Typography } from "@tiptap/extension-typography";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import { CodeBlockLowlight } from "@tiptap/extension-code-block-lowlight";
import { TextStyle, Color } from "@tiptap/extension-text-style";
import { Highlight } from "@tiptap/extension-highlight";
import { Subscript } from "@tiptap/extension-subscript";
import { Superscript } from "@tiptap/extension-superscript";
import { Image } from "@/tiptap/extensions/image-node/image-node-extension";

import { common, createLowlight } from "lowlight";

const lowlight = createLowlight(common);

// Extensions for static rendering (without editor-specific features)
export const baseExtensions = [
  Typography,
  TaskList,
  TaskItem.configure({
    nested: true,
  }),
  CodeBlockLowlight.configure({
    lowlight,
  }),
  TextStyle,
  Color,
  Highlight,
  Subscript,
  Superscript,
  Image,
];

export const editorProps = {
  attributes: {
    class:
      "relative prose prose-main dark:prose-invert min-h-full w-full max-w-5xl mx-auto p-4 px-6 md:px-12 pb-64 focus:outline-none",
    style:
      "overflow-wrap: break-word; word-wrap: break-word; word-break: break-word;",
  },
};

export const TURN_INTO_BLOCKS = [
  "paragraph",
  "heading",
  "bulletList",
  "orderedList",
  "taskList",
  "blockquote",
  "codeBlock",
];
