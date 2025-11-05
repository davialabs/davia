import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  ChevronDownIcon,
  TextIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  ListIcon,
  ListOrderedIcon,
  ListTodoIcon,
  TextQuoteIcon,
  CheckIcon,
} from "lucide-react";
import { CodeBlockIcon } from "@/tiptap/icons/code-block-icon";
import { useEditorState, type Editor } from "@tiptap/react";
import { useState } from "react";
import { TiptapTooltip } from "../tiptap-tooltip";

export function TurnIntoPopover({ editor }: { editor: Editor }) {
  const [open, setOpen] = useState(false);
  const editorState = useEditorState({
    editor: editor,
    // This function will be called every time the editor state changes
    selector: ({ editor }: { editor: Editor }) => ({
      isParagraph: editor.isActive("paragraph"),
      isHeading1: editor.isActive("heading", { level: 1 }),
      isHeading2: editor.isActive("heading", { level: 2 }),
      isHeading3: editor.isActive("heading", { level: 3 }),
      isHeading4: editor.isActive("heading", { level: 4 }),
      isHeading5: editor.isActive("heading", { level: 5 }),
      isHeading6: editor.isActive("heading", { level: 6 }),
      isBulletList: editor.isActive("bulletList"),
      isOrderedList: editor.isActive("orderedList"),
      isTaskList: editor.isActive("taskList"),
      isBlockquote: editor.isActive("blockquote"),
      isCodeBlock: editor.isActive("codeBlock"),
    }),
  });

  const items = [
    {
      name: "Text",
      icon: TextIcon,
      command: (editor: Editor) => editor.chain().focus().clearNodes().run(),
      isActive:
        editorState.isParagraph &&
        !editorState.isBulletList &&
        !editorState.isOrderedList,
    },
    {
      name: "Heading 1",
      icon: Heading1Icon,
      command: (editor: Editor) =>
        editor.chain().focus().clearNodes().toggleHeading({ level: 1 }).run(),
      isActive: editorState.isHeading1,
    },
    {
      name: "Heading 2",
      icon: Heading2Icon,
      command: (editor: Editor) =>
        editor.chain().focus().clearNodes().toggleHeading({ level: 2 }).run(),
      isActive: editorState.isHeading2,
    },
    {
      name: "Heading 3",
      icon: Heading3Icon,
      command: (editor: Editor) =>
        editor.chain().focus().clearNodes().toggleHeading({ level: 3 }).run(),
      isActive: editorState.isHeading3,
    },
    {
      name: "Bullet list",
      icon: ListIcon,
      command: (editor: Editor) =>
        editor.chain().focus().clearNodes().toggleBulletList().run(),
      isActive: editorState.isBulletList,
    },
    {
      name: "Numbered list",
      icon: ListOrderedIcon,
      command: (editor: Editor) =>
        editor.chain().focus().clearNodes().toggleOrderedList().run(),
      isActive: editorState.isOrderedList,
    },
    {
      name: "Task list",
      icon: ListTodoIcon,
      command: (editor: Editor) =>
        editor.chain().focus().clearNodes().toggleTaskList().run(),
      isActive: editorState.isTaskList,
    },
    {
      name: "Quote",
      icon: TextQuoteIcon,
      command: (editor: Editor) =>
        editor.chain().focus().clearNodes().toggleBlockquote().run(),
      isActive: editorState.isBlockquote,
    },
    {
      name: "Code",
      icon: CodeBlockIcon,
      command: (editor: Editor) =>
        editor.chain().focus().clearNodes().toggleCodeBlock().run(),
      isActive: editorState.isCodeBlock,
    },
  ];

  const activeItem = items.filter((item) => item.isActive).pop() ?? {
    name: "Multiple",
  };

  return (
    <Popover modal open={open} onOpenChange={setOpen}>
      <TiptapTooltip content="Turn into">
        <PopoverTrigger asChild>
          <Button size="sm" variant="ghost" className="h-7">
            {activeItem.name}
            <ChevronDownIcon className="size-3" />
          </Button>
        </PopoverTrigger>
      </TiptapTooltip>
      <PopoverContent
        className="w-50 p-1 max-h-80 overflow-y-auto"
        align="start"
      >
        {items.map((item) => (
          <div
            key={item.name}
            onClick={() => {
              item.command(editor);
              setOpen(false);
            }}
            className="flex cursor-pointer items-center justify-between rounded-sm px-2 py-1 text-sm hover:bg-accent"
          >
            <div className="flex items-center space-x-2">
              <item.icon className="size-4" />
              <span>{item.name}</span>
            </div>
            {activeItem.name === item.name && <CheckIcon className="size-4" />}
          </div>
        ))}
      </PopoverContent>
    </Popover>
  );
}
