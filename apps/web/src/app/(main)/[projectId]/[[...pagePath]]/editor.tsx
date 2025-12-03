"use client";

import { useEffect } from "react";
import { PageRegistryStoreProvider } from "@/providers/page-registry";
import { GlobalDndProvider } from "@/providers/global-dnd-provider";
import { useProjects } from "@/providers/projects-provider";
import { extractTitle } from "@/lib/utils";
import { useDebounceCallback } from "usehooks-ts";

// --- Tiptap core ---
import "@/tiptap/styles/editor.css";
import {
  EditorContent,
  EditorContext,
  useEditor,
  type Editor as TiptapEditor,
} from "@tiptap/react";
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
import { ExcalidrawExtension } from "@/tiptap/extensions/excalidraw";

// --- Tiptap hooks ---
import { useUiEditorState } from "@/tiptap/hooks/use-ui-editor-state";

// --- Tiptap components ---
import { DragContextMenu } from "@/tiptap/ui/drag-context-menu";
import { SlashDropdownMenu } from "@/tiptap/ui/slash-dropdown-menu";
import { FloatingToolbar } from "@/tiptap/ui/floating-toolbar";
import { Spinner } from "@/components/ui/spinner";

export function Editor({
  projectId,
  pagePath,
  initialContent,
}: {
  projectId: string;
  pagePath: string;
  initialContent: string;
}) {
  const { setTrees } = useProjects();

  const handleUpdate = useDebounceCallback(
    async (htmlContent: string) => {
      const filePath = pagePath + ".html";

      // POST to /api/content
      try {
        const response = await fetch("/api/content", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            projectId,
            path: filePath,
            content: htmlContent,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("Failed to update content:", errorData.error);
          return;
        }

        // Extract title from HTML content
        const title = extractTitle(htmlContent);

        // Update the tree for the current projectId and pagePath
        setTrees((prev) => {
          if (!prev[projectId]) {
            return prev;
          }

          const updatedTrees = { ...prev };
          const projectTree = { ...updatedTrees[projectId] };

          if (projectTree[pagePath]) {
            projectTree[pagePath] = {
              ...projectTree[pagePath],
              title,
            };
          } else {
            // If the pagePath doesn't exist in the tree, create it
            projectTree[pagePath] = {
              title,
              children: [],
            };
          }

          updatedTrees[projectId] = projectTree;
          return updatedTrees;
        });
      } catch (error) {
        console.error("Error updating content:", error);
      }
    },
    300 // 300ms debounce delay
  );

  const editor = useEditor({
    // Don't render immediately on the server to avoid SSR issues
    immediatelyRender: false,
    editorProps,
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
      ExcalidrawExtension,
    ],
  });

  // Effect 1: Set initial content when editor is ready or initialContent changes
  useEffect(() => {
    if (!editor) return;
    editor.commands.setContent(initialContent, { emitUpdate: false });
  }, [editor, initialContent]);

  // Effect 2: Subscribe to update event
  useEffect(() => {
    if (!editor) return;

    const handleUpdateEvent = async ({ editor }: { editor: TiptapEditor }) => {
      const htmlContent = editor.getHTML();
      await handleUpdate(htmlContent);
    };

    editor.on("update", handleUpdateEvent);

    // Cleanup: unsubscribe from update event
    return () => {
      editor.off("update", handleUpdateEvent);
    };
  }, [editor, handleUpdate]);

  const { isDragging } = useUiEditorState(editor);

  if (!editor)
    return (
      <div className="flex flex-1 items-center justify-center h-full p-4">
        <Spinner />
      </div>
    );

  return (
    <PageRegistryStoreProvider projectId={projectId}>
      <GlobalDndProvider>
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
      </GlobalDndProvider>
    </PageRegistryStoreProvider>
  );
}
