import { useRef, useState } from "react";

import { UnfoldHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";

interface ComparisonProps {
  leftComponent: React.ReactNode;
  rightComponent: React.ReactNode;
}

export default function Comparison({
  leftComponent,
  rightComponent,
}: ComparisonProps) {
  const [inset, setInset] = useState<number>(3);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const updateInsetFromClientX = (clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    setInset(Math.max(0, Math.min(100, percentage)));
  };

  const onMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;

    if ("touches" in e && e.touches.length > 0 && e.touches[0]) {
      updateInsetFromClientX(e.touches[0].clientX);
    } else if ("clientX" in e) {
      updateInsetFromClientX(e.clientX);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full select-none grid min-h-24"
      onMouseMove={onMouseMove}
      onMouseUp={() => setIsDragging(false)}
      onTouchMove={onMouseMove}
      onTouchEnd={() => setIsDragging(false)}
      onMouseLeave={() => setIsDragging(false)}
    >
      {/* Left side - clipped to the left region with its own non-invasive background */}
      <div
        className="col-start-1 row-start-1 relative z-10 overflow-hidden flex items-center rounded-md"
        style={{ clipPath: `inset(0 calc(100% - ${inset}%) 0 0)` }}
      >
        <div
          className="absolute inset-0 z-0 pointer-events-none bg-background"
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 z-0 pointer-events-none bg-red-50/30 dark:bg-red-950/30"
          aria-hidden="true"
        />
        <div className="relative px-6 py-2 z-10 w-full">{leftComponent}</div>
      </div>

      {/* Right side - clipped to the right region with its own non-invasive background */}
      <div
        className="col-start-1 row-start-1 relative z-10 overflow-hidden flex items-center rounded-md"
        style={{ clipPath: `inset(0 0 0 ${inset}%)` }}
      >
        <div
          className="absolute inset-0 z-0 pointer-events-none bg-background"
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 z-0 pointer-events-none bg-emerald-50/30 dark:bg-emerald-950/30"
          aria-hidden="true"
        />
        <div className="relative px-6 py-2 z-10 w-full">{rightComponent}</div>
      </div>

      {/* Separator line and handle */}
      <div
        className="absolute inset-y-0 w-0.5 bg-border z-20"
        style={{ left: `${inset}%` }}
      />
      <Button
        aria-label="Resize comparison"
        variant="outline"
        size="icon"
        className="w-6 absolute top-1/2 -translate-y-1/2 -ml-[11px] z-30 dark:bg-background dark:border dark:hover:bg-accent cursor-ew-resize shadow-md hover:shadow-lg transition-transform hover:scale-110"
        style={{ left: `${inset}%` }}
        onTouchStart={(e) => {
          setIsDragging(true);
          if (e.touches.length > 0 && e.touches[0]) {
            updateInsetFromClientX(e.touches[0].clientX);
          }
        }}
        onMouseDown={(e) => {
          setIsDragging(true);
          updateInsetFromClientX(e.clientX);
        }}
        onTouchEnd={() => setIsDragging(false)}
        onMouseUp={() => setIsDragging(false)}
      >
        <UnfoldHorizontal className="text-muted-foreground" />
      </Button>

      {/* Bottom labels: single anchored container for smoother movement */}
      <div
        className="absolute bottom-0 z-30 -translate-x-1/2 flex items-center pointer-events-none ml-[3px]"
        style={{ left: `${inset}%` }}
      >
        <Button
          className="pointer-events-auto h-4 px-2 py-0 text-xs leading-none rounded-none rounded-l bg-border hover:bg-foreground text-foreground hover:text-background hover:scale-105 transition-all duration-200"
          onClick={() => setInset(99)}
        >
          Old
        </Button>
        <Button
          className="pointer-events-auto h-4 px-2 py-0 text-xs leading-none rounded-none rounded-r bg-border hover:bg-foreground text-foreground hover:text-background hover:scale-105 transition-all duration-200"
          onClick={() => setInset(1)}
        >
          New
        </Button>
      </div>
    </div>
  );
}
