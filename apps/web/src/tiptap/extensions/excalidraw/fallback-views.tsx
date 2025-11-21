"use client";

import { useState, useEffect } from "react";
import type { Project } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, CopyIcon, CheckIcon } from "lucide-react";
import { useCopyToClipboard } from "usehooks-ts";

export function ExcalidrawErrorFallback({
  error,
  project,
  path,
  content,
}: {
  error: string;
  project: Project | null;
  path: string;
  content: string | null;
}) {
  const [, copy] = useCopyToClipboard();
  const [copied, setCopied] = useState(false);

  const errorMessage = `An error occurred while rendering an Excalidraw whiteboard. Fix it:

Error: \`${error}\`

File path: \`${project ? `${project.path}/.davia/assets/${path}` : path}\`${
    content
      ? `

Content:

\`\`\`
${content}
\`\`\``
      : ""
  }`;

  const handleCopy = async () => {
    await copy(errorMessage);
    setCopied(true);
  };

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => {
        setCopied(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>An error occurred with a whiteboard</CardTitle>
        <CardDescription className="text-card-foreground">
          Copy the error details below and send them to your favorite AI agent
          to help fix the issue.
        </CardDescription>
        <CardAction>
          <AlertCircle className="size-5 text-destructive" />
        </CardAction>
      </CardHeader>
      <CardContent className="flex w-full">
        <code className="flex-1 max-h-40 overflow-y-auto whitespace-pre-wrap">
          {errorMessage}
        </code>
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full" onClick={handleCopy}>
          <div className="relative w-4 h-4">
            <CopyIcon
              className={`absolute inset-0 w-4 h-4 transition-all duration-300 ${
                copied ? "opacity-0 scale-0" : "opacity-100 scale-100"
              }`}
            />
            <CheckIcon
              className={`absolute inset-0 w-4 h-4 transition-all duration-300 ${
                copied ? "opacity-100 scale-100" : "opacity-0 scale-0"
              }`}
            />
          </div>
          {copied ? "Copied" : "Copy to clipboard"}
        </Button>
      </CardFooter>
    </Card>
  );
}

export function ExcalidrawLoading() {
  return (
    <div className="flex flex-col gap-2 p-2 items-center justify-center">
      <Skeleton className="h-12 w-1/3" />
    </div>
  );
}
