import type { Editor, NodeViewProps } from "@tiptap/react";
import { NodeViewWrapper } from "@tiptap/react";
import { useEffect, useRef, useState } from "react";
import * as React from "react";
import { cn } from "@/lib/utils";
import { ImageNodeFloating } from "./image-node-floating";

export interface ResizeParams {
  handleUsed: "left" | "right";
  initialWidth: number;
  initialClientX: number;
}

export interface ResizableImageProps
  extends React.HTMLAttributes<HTMLDivElement> {
  src: string;
  alt?: string;
  editor?: Editor;
  minWidth?: number;
  maxWidth?: number;
  align?: "left" | "center" | "right";
  initialWidth?: number;
  onImageResize?: (width?: number) => void;
}

export function ImageNodeView(props: NodeViewProps) {
  const { editor, node, updateAttributes } = props;

  return (
    <ResizableImage
      src={node.attrs.src}
      alt={node.attrs.alt || ""}
      editor={editor}
      align={node.attrs["data-align"]}
      initialWidth={node.attrs.width}
      onImageResize={(width) => updateAttributes({ width })}
    />
  );
}

export const ResizableImage: React.FC<ResizableImageProps> = ({
  src,
  alt = "",
  editor,
  minWidth = 96,
  maxWidth = 800,
  align = "left",
  initialWidth,
  onImageResize,
}) => {
  const [resizeParams, setResizeParams] = useState<ResizeParams | undefined>(
    undefined
  );
  const [width, setWidth] = useState<number | undefined>(initialWidth);
  const [showHandles, setShowHandles] = useState<boolean>(false);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const leftResizeHandleRef = useRef<HTMLDivElement>(null);
  const rightResizeHandleRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const windowMouseMoveHandler = React.useCallback(
    (event: MouseEvent): void => {
      if (!resizeParams || !editor) {
        return;
      }

      let newWidth: number;

      if (align === "center") {
        if (resizeParams.handleUsed === "left") {
          newWidth =
            resizeParams.initialWidth +
            (resizeParams.initialClientX - event.clientX) * 2;
        } else {
          newWidth =
            resizeParams.initialWidth +
            (event.clientX - resizeParams.initialClientX) * 2;
        }
      } else {
        if (resizeParams.handleUsed === "left") {
          newWidth =
            resizeParams.initialWidth +
            resizeParams.initialClientX -
            event.clientX;
        } else {
          newWidth =
            resizeParams.initialWidth +
            event.clientX -
            resizeParams.initialClientX;
        }
      }

      const effectiveMinWidth = minWidth;
      const effectiveMaxWidth =
        editor.view.dom?.firstElementChild?.clientWidth || maxWidth;

      const newCalculatedWidth = Math.min(
        Math.max(newWidth, effectiveMinWidth),
        effectiveMaxWidth
      );

      setWidth(newCalculatedWidth);
      if (wrapperRef.current) {
        wrapperRef.current.style.width = `${newCalculatedWidth}px`;
      }
    },
    [editor, align, maxWidth, minWidth, resizeParams]
  );

  const windowMouseUpHandler = React.useCallback(
    (event: MouseEvent): void => {
      if (!editor) {
        return;
      }

      if (
        (!event.target ||
          !wrapperRef.current?.contains(event.target as Node) ||
          !editor.isEditable) &&
        showHandles
      ) {
        setShowHandles(false);
      }

      if (!resizeParams) {
        return;
      }

      setResizeParams(undefined);

      if (onImageResize) {
        onImageResize(width);
      }
    },
    [editor, showHandles, resizeParams, onImageResize, width]
  );

  const leftResizeHandleMouseDownHandler = (
    event: React.MouseEvent<HTMLDivElement>
  ): void => {
    event.preventDefault();

    setResizeParams({
      handleUsed: "left",
      initialWidth: wrapperRef.current?.clientWidth || Number.MAX_VALUE,
      initialClientX: event.clientX,
    });
  };

  const rightResizeHandleMouseDownHandler = (
    event: React.MouseEvent<HTMLDivElement>
  ): void => {
    event.preventDefault();

    setResizeParams({
      handleUsed: "right",
      initialWidth: wrapperRef.current?.clientWidth || Number.MAX_VALUE,
      initialClientX: event.clientX,
    });
  };

  const wrapperMouseEnterHandler = (): void => {
    if (editor && editor.isEditable) {
      setShowHandles(true);
    }
  };

  const wrapperMouseLeaveHandler = (
    event: React.MouseEvent<HTMLDivElement>
  ): void => {
    if (
      event.relatedTarget === leftResizeHandleRef.current ||
      event.relatedTarget === rightResizeHandleRef.current
    ) {
      return;
    }

    if (resizeParams) {
      return;
    }

    if (editor && editor.isEditable) {
      setShowHandles(false);
    }
  };

  useEffect(() => {
    window.addEventListener("mousemove", windowMouseMoveHandler);
    window.addEventListener("mouseup", windowMouseUpHandler);

    return () => {
      window.removeEventListener("mousemove", windowMouseMoveHandler);
      window.removeEventListener("mouseup", windowMouseUpHandler);
    };
  }, [windowMouseMoveHandler, windowMouseUpHandler]);

  return (
    <NodeViewWrapper
      onMouseEnter={wrapperMouseEnterHandler}
      onMouseLeave={wrapperMouseLeaveHandler}
      data-align={align}
      data-width={width}
      className={cn(
        "flex w-full my-6",
        align === "right" && "text-right justify-end",
        align === "center" && "text-center justify-center"
      )}
      contentEditable={false}
    >
      <div
        ref={wrapperRef}
        className="group cursor-pointer select-none flex flex-col [.ProseMirror-selectednode_&]:outline-2 [.ProseMirror-selectednode_&]:outline-cyan-500 [.ProseMirror-selectednode_&]:rounded-sm [.ProseMirror-selectednode_&]:outline-offset-0"
        style={{
          width: width ? `${width}px` : "fit-content",
        }}
      >
        <div className="flex items-center max-w-full relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imageRef}
            src={src}
            alt={alt}
            className="w-full rounded-sm"
            contentEditable={false}
            draggable={false}
          />

          {/* Floating toolbar in top right corner */}
          {editor && editor.isEditable && (
            <div className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <ImageNodeFloating editor={editor} />
            </div>
          )}

          {showHandles && editor && editor.isEditable && (
            <>
              <div
                ref={leftResizeHandleRef}
                className="absolute top-1/2 w-1.5 h-12 bg-cyan-500 rounded-full cursor-ew-resize -translate-y-1/2 z-10 left-1"
                onMouseDown={leftResizeHandleMouseDownHandler}
              />
              <div
                ref={rightResizeHandleRef}
                className="absolute top-1/2 w-1.5 h-12 bg-cyan-500 rounded-full cursor-ew-resize -translate-y-1/2 z-10 right-1"
                onMouseDown={rightResizeHandleMouseDownHandler}
              />
            </>
          )}
        </div>
      </div>
    </NodeViewWrapper>
  );
};
