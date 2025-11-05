"use client";

import { useTransition } from "react";
import type { ReactNodeViewProps } from "@tiptap/react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";

export function DatabaseErrorFallback({
  error,
  props,
  content,
}: {
  error: string;
  props: ReactNodeViewProps;
  content?: string;
}) {
  const [isPendingDelete, startTransition] = useTransition();

  const handleDeleteCurrentNodeAndRefresh = () => {
    startTransition(async () => {
      try {
        props.deleteNode();
      } catch {
        // no-op: best-effort deletion
      }

      const waitForSave = () =>
        new Promise<void>((resolve) => setTimeout(resolve, 1000));

      await waitForSave();
      if (typeof window !== "undefined") {
        window.location.reload();
      }
    });
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>An error occurred</CardTitle>
        <CardDescription>
          We are having trouble with this database.
        </CardDescription>
        <CardAction>
          <AlertCircle className="size-5 text-destructive" />
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          <div className="flex flex-col md:flex-row gap-2 max-w-full">
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full md:flex-1"
                  disabled={isPendingDelete}
                >
                  Show details
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Error details</DialogTitle>
                  <DialogDescription>{error}</DialogDescription>
                  {content && (
                    <pre className="overflow-y-auto max-h-48 text-xs">
                      <code className="whitespace-pre-wrap break-all">
                        {content}
                      </code>
                    </pre>
                  )}
                </DialogHeader>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Close</Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button
              variant="destructive"
              onClick={handleDeleteCurrentNodeAndRefresh}
              className="w-full"
              disabled={isPendingDelete}
            >
              Delete this element and refresh
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function DatabaseLoading() {
  return (
    <div className="flex flex-col gap-2 p-2 items-center justify-center">
      <Skeleton className="h-12 w-1/3" />
    </div>
  );
}
