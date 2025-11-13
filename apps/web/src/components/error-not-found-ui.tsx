"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon, CircleXIcon, HomeIcon, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";

interface NotFoundUIProps {
  /** Custom error code to display */
  errorCode?: string;
  /** Main heading text */
  title?: string;
  /** Subtitle/description text */
  description?: string;
  /** Reset function */
  reset?: () => void;
}

export function ErrorNotFoundUI({
  errorCode,
  title = "Page not found",
  description = "The page you are looking for does not exist or has been removed.",
  reset,
}: NotFoundUIProps) {
  const router = useRouter();

  return (
    <main className="h-screen w-full flex items-start md:items-center justify-center py-16 px-4 md:py-24 md:px-20">
      {/* Background gradient */}
      <div className="fixed inset-0 z-0 opacity-50 bg-[linear-gradient(to_right,var(--muted-foreground),transparent_1px),linear-gradient(to_bottom,var(--muted-foreground),transparent_1px)] bg-size-[32px_32px] md:bg-size-[48px_48px] mask-[radial-gradient(ellipse_60%_30%_at_50%_50%,black_0%,transparent_100%)] md:mask-[radial-gradient(ellipse_30%_30%_at_50%_50%,black_0%,transparent_100%)]" />

      <section className="flex flex-col items-center gap-8 md:gap-16 z-10">
        <div className="flex flex-col items-center gap-8 md:gap-12">
          <header className="flex flex-col items-center gap-4">
            {errorCode && (
              <div>
                <Badge variant="outline">
                  <CircleXIcon />
                  {errorCode}
                </Badge>
              </div>
            )}
            <div className="flex flex-col items-center gap-4 md:gap-6">
              <h1 className="text-center text-4xl md:text-6xl font-semibold">
                {title}
              </h1>
              <p className="text-center text-lg md:text-xl text-muted-foreground">
                {description}
              </p>
            </div>
          </header>
          <div className="flex gap-2 flex-col md:flex-row w-full items-center justify-center">
            {reset ? (
              <Button
                className="w-full md:w-fit"
                variant="outline"
                onClick={reset}
              >
                <RotateCcw />
                Retry
              </Button>
            ) : (
              <Button
                className="w-full md:w-fit"
                variant="outline"
                onClick={() => router.back()}
              >
                <ArrowLeftIcon />
                Go back
              </Button>
            )}
            <Button
              className="w-full md:w-fit"
              onClick={() => router.push("/")}
            >
              <HomeIcon />
              Home
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
