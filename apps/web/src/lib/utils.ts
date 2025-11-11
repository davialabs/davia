import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Gets the base name of a path
 */
export function getBaseName(path: string): string {
  const parts = path.split("/").filter(Boolean);
  return parts[parts.length - 1] || path;
}

/**
 * Extracts the first <h1> tag's text content from an HTML file
 */
export function extractTitle(htmlContent: string): string {
  const h1Match = htmlContent.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);

  if (!h1Match || !h1Match[1]) {
    return "Untitled";
  }

  // Strip all HTML tags from the captured content
  const textOnly = h1Match[1].replace(/<[^>]+>/g, "").trim();

  return textOnly || "Untitled";
}
