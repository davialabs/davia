"use client";

import { PageRegistryStoreProvider } from "@/providers/page-registry";

// --- Tiptap core ---
import "@/tiptap/styles/editor.css";
import { EditorContent, EditorContext, useEditor } from "@tiptap/react";
import { baseExtensions, editorProps } from "@/tiptap/config";

// --- Tiptap extensions ---
import { Document } from "@tiptap/extension-document";
import { StarterKit } from "@tiptap/starter-kit";
import { Placeholder, Selection } from "@tiptap/extensions";
import { UiStateExtension } from "@/tiptap/ui-state-extension";

// --- Custom extensions ---
import { TitlePlaceholder } from "@/tiptap/extensions/title-placeholder";
import { MdxExtension } from "@/tiptap/extensions/mdx";
import { DatabaseExtension } from "@/tiptap/extensions/database";

// --- Tiptap hooks ---
import { useUiEditorState } from "@/tiptap/hooks/use-ui-editor-state";

// --- Tiptap components ---
import { DragContextMenu } from "@/tiptap/ui/drag-context-menu";
import { SlashDropdownMenu } from "@/tiptap/ui/slash-dropdown-menu";
import { FloatingToolbar } from "@/tiptap/ui/floating-toolbar";
import { Spinner } from "@/components/ui/spinner";

export function Editor({
  projectId,
  initialContent,
}: {
  projectId: string;
  initialContent: string;
}) {
  const editor = useEditor({
    // Don't render immediately on the server to avoid SSR issues
    immediatelyRender: false,
    editorProps,
    content: initialContent,
    extensions: [
      Document.extend({
        content: "heading block*",
      }),
      StarterKit.configure({
        codeBlock: false,
        heading: {
          levels: [1, 2, 3],
        },
        document: false,
        dropcursor: {
          width: 2,
        },
      }),
      ...baseExtensions,
      Selection,
      UiStateExtension,
      // Title placeholder shows even when not focused
      TitlePlaceholder,
      // Generic placeholder for current node (paragraphs, etc.)
      Placeholder.configure({
        placeholder: ({ node, editor }) => {
          if (node.type.name === "paragraph" && editor.isFocused) {
            return "Write, press 'space' for AI, '/' for commands...";
          }
          return "";
        },
      }),
      MdxExtension,
      DatabaseExtension,
    ],
  });
  const { isDragging } = useUiEditorState(editor);

  if (!editor)
    return (
      <div className="flex flex-1 items-center justify-center h-full p-4">
        <Spinner />
      </div>
    );

  return (
    <PageRegistryStoreProvider projectId={projectId}>
      <EditorContext value={{ editor }}>
        <div className="h-full flex flex-col">
          <EditorContent
            role="document-editor"
            className="flex-1"
            editor={editor}
            style={{ cursor: isDragging ? "grabbing" : "auto" }}
            data-onboarding="editor"
          >
            <DragContextMenu />
            <SlashDropdownMenu />
            <FloatingToolbar />
          </EditorContent>
        </div>
      </EditorContext>
    </PageRegistryStoreProvider>
  );
}
