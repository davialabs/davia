"use client";

import { ErrorNotFoundUI } from "@/components/error-not-found-ui";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <ErrorNotFoundUI
      title="Something went wrong"
      description="Sorry, an error occurred while loading the page."
      reset={reset}
    />
  );
}
