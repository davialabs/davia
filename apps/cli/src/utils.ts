import { dirname, join } from "path";
import { existsSync } from "fs";

/**
 * Find monorepo root (where pnpm-workspace.yaml or turbo.json exists)
 * by traversing up the directory tree from the start path.
 */
export function findMonorepoRoot(startPath: string): string {
  let current = startPath;
  while (current !== dirname(current)) {
    if (
      existsSync(join(current, "pnpm-workspace.yaml")) ||
      existsSync(join(current, "turbo.json"))
    ) {
      return current;
    }
    current = dirname(current);
  }
  return startPath;
}

