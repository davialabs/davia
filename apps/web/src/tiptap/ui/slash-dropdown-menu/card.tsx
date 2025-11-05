"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const Card = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "bg-popover text-popover-foreground rounded-md border shadow-md flex flex-col items-center min-w-0 outline-hidden",
          className
        )}
        {...props}
      />
    );
  }
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "w-full flex items-center justify-between px-2 py-1.5 border-b",
        className
      )}
      {...props}
    />
  );
});
CardHeader.displayName = "CardHeader";

const CardBody = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("w-full flex-1 overflow-y-auto p-1 min-w-0", className)}
        {...props}
      />
    );
  }
);
CardBody.displayName = "CardBody";

const CardItemGroup = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    orientation?: "horizontal" | "vertical";
  }
>(({ className, orientation = "vertical", ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-orientation={orientation}
      className={cn(
        "relative flex min-w-max",
        orientation === "vertical"
          ? "flex-col justify-center"
          : "flex-row items-center gap-1",
        className
      )}
      {...props}
    />
  );
});
CardItemGroup.displayName = "CardItemGroup";

const CardGroupLabel = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "px-2 py-1.5 text-xs font-medium capitalize text-muted-foreground",
        className
      )}
      {...props}
    />
  );
});
CardGroupLabel.displayName = "CardGroupLabel";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("w-full px-2 py-1.5 border-t", className)}
      {...props}
    />
  );
});
CardFooter.displayName = "CardFooter";

export {
  Card,
  CardHeader,
  CardFooter,
  CardBody,
  CardItemGroup,
  CardGroupLabel,
};
