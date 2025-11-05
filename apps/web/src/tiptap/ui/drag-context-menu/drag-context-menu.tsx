"use client";

import * as React from "react";
import type { Node as TiptapNode } from "@tiptap/pm/model";
import { offset } from "@floating-ui/react";

// Core
import { DragHandle } from "@tiptap/extension-drag-handle-react";
import type {
  ColorMenuItemProps,
  DragContextMenuProps,
  MenuItemProps,
  NodeChangeData,
} from "./drag-context-menu-types";
import { useMenuActionVisibility } from "./drag-context-menu-hooks";

// Hooks
import { useTiptapEditor } from "@/tiptap/hooks/use-tiptap-editor";
import { useUiEditorState } from "@/tiptap/hooks/use-ui-editor-state";
import { selectNodeAndHideFloating } from "@/tiptap/hooks/use-floating-toolbar-visibility";
import { useIsMobile } from "@/hooks/use-mobile";

// Utils
import {
  getNodeDisplayName,
  isTextSelectionValid,
} from "@/tiptap/collab-utils";
import { cn } from "@/lib/utils";

// UI
import { useDuplicate } from "@/tiptap/ui/duplicate-button";
import { useDeleteNode } from "@/tiptap/ui/delete-node-button";

// UI Primitives
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Icons
import { GripVerticalIcon } from "lucide-react";

export const CoreActionsGroup = () => {
  const {
    handleDuplicate,
    canDuplicate,
    label: duplicateLabel,
    Icon: DuplicateIcon,
  } = useDuplicate();
  const {
    handleDeleteNode,
    canDeleteNode,
    label: deleteLabel,
    Icon: DeleteIcon,
  } = useDeleteNode();

  return (
    <DropdownMenuGroup>
      <DropdownMenuItem onClick={handleDuplicate} disabled={!canDuplicate}>
        <DuplicateIcon />
        {duplicateLabel}
      </DropdownMenuItem>
      <DropdownMenuItem
        onClick={handleDeleteNode}
        disabled={!canDeleteNode}
        className="hover:!text-destructive hover:[&_svg]:!text-destructive"
      >
        <DeleteIcon />
        {deleteLabel}
      </DropdownMenuItem>
    </DropdownMenuGroup>
  );
};

export const DragContextMenu: React.FC<DragContextMenuProps> = ({
  editor: providedEditor,
  className,
  ...props
}) => {
  const { editor } = useTiptapEditor(providedEditor);
  const { isDragging } = useUiEditorState(editor);
  const isMobile = useIsMobile();
  const [open, setOpen] = React.useState(false);
  const [node, setNode] = React.useState<TiptapNode | null>(null);
  const [nodePos, setNodePos] = React.useState<number>(-1);

  const handleNodeChange = React.useCallback((data: NodeChangeData) => {
    if (data.node) setNode(data.node);
    setNodePos(data.pos);
  }, []);

  React.useEffect(() => {
    if (!editor) return;
    editor.commands.setLockDragHandle(open);
    editor.commands.setMeta("lockDragHandle", open);
  }, [editor, open]);

  const {
    hasAnyActionGroups,
    hasColorActions,
    hasTransformActions,
    hasResetFormatting,
    hasImage,
  } = useMenuActionVisibility(editor);

  const dynamicPositions = React.useMemo(() => {
    return {
      middleware: [
        offset((props) => {
          const { rects } = props;
          const nodeHeight = rects.reference.height;
          const dragHandleHeight = rects.floating.height;

          const crossAxis = nodeHeight / 2 - dragHandleHeight / 2;

          return {
            mainAxis: 16,
            // if height is more than 40px, then it's likely a block node
            crossAxis: nodeHeight > 40 ? 0 : crossAxis,
          };
        }),
      ],
    };
  }, []);

  const handleOnMenuClose = React.useCallback(() => {
    if (editor) {
      editor.commands.setMeta("hideDragHandle", true);
    }
  }, [editor]);

  const onElementDragStart = React.useCallback(() => {
    if (!editor) return;
    editor.commands.setIsDragging(true);
  }, [editor]);

  const onElementDragEnd = React.useCallback(() => {
    if (!editor) return;
    editor.commands.setIsDragging(false);
  }, [editor]);

  if (!editor || isMobile) return null;

  return (
    <DragHandle
      editor={editor}
      onNodeChange={handleNodeChange}
      computePositionConfig={dynamicPositions}
      onElementDragStart={onElementDragStart}
      onElementDragEnd={onElementDragEnd}
      className={cn(
        className,
        isTextSelectionValid(editor) && "opacity-0 pointer-events-none",
        isDragging && "opacity-0"
      )}
      {...props}
    >
      <div className="relative inline-block">
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-7 w-6 cursor-grab",
                open && "pointer-events-none"
              )}
              onClick={() => {
                // Handle selection and open dropdown
                selectNodeAndHideFloating(editor, nodePos);
                setOpen(true);
              }}
            >
              <GripVerticalIcon />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <div>
              <span className="font-medium">Drag</span> to move
            </div>
            <div>
              <span className="font-medium">Click</span> for options
            </div>
          </TooltipContent>
        </Tooltip>

        <DropdownMenu
          modal={false}
          open={open}
          onOpenChange={(open) => {
            setOpen(open);
            if (!open) {
              handleOnMenuClose();
            }
          }}
        >
          <DropdownMenuTrigger asChild>
            {/* Invisible anchor aligned with the button for correct positioning */}
            <div
              className="absolute top-0 left-0 h-7 w-6 opacity-0 pointer-events-none"
              aria-hidden
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="start" side="left">
            <DropdownMenuLabel>{getNodeDisplayName(editor)}</DropdownMenuLabel>
            <CoreActionsGroup />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </DragHandle>
  );
};
