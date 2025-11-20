import { readFileSync } from "fs";
import { join } from "path";
import type { Loader, Plugin } from "esbuild";
import type { DataCollector } from "./types";

/**
 * Plugin to resolve imports starting with ~/ and ending with .json to virtual data modules
 * Resolves:
 * - ~/data/todos.json -> "data/todos.json" from Supabase
 */
export const createDaviaDataPlugin = (
  dataCollector: DataCollector
): Plugin => ({
  name: "davia-data",

  setup(build) {
    // Route only JSON imports that start with "~/" to davia-data namespace
    build.onResolve({ filter: /^~\/.*\.json$/i }, (args) => ({
      path: args.path.replace(/^~\//, ""), // e.g. "data/todos.json"
      namespace: "davia-data-ns",
    }));

    // Load virtual data modules and expose the key as default export
    build.onLoad({ filter: /.*/, namespace: "davia-data-ns" }, async (args) => {
      const dataPath = args.path; // already stripped of "~/"
      dataCollector.add(dataPath);
      const contents = `export default ${JSON.stringify(dataPath)};`;
      return {
        contents,
        loader: "ts" as Loader,
      };
    });
  },
});

/**
 * Plugin to resolve shadcn imports from public/shadcn folder
 * Resolves to local file system:
 * - @/components/ui/* -> shadcnPath/components/ui/<component>.tsx
 * - @/lib/utils -> shadcnPath/lib/utils.ts
 * - @/hooks/use-mobile -> shadcnPath/hooks/use-mobile.ts
 */
export const createShadcnPlugin = (shadcnPath: string): Plugin => ({
  name: "shadcn",

  setup(build) {
    // Map @/lib/utils to local utils.ts
    build.onResolve({ filter: /^@\/lib\/utils$/ }, () => ({
      path: join(shadcnPath, "lib", "utils.ts"),
      namespace: "shadcn-fs",
    }));

    // Map @/hooks/use-mobile to local use-mobile.ts
    build.onResolve({ filter: /^@\/hooks\/use-mobile$/ }, () => ({
      path: join(shadcnPath, "hooks", "use-mobile.ts"),
      namespace: "shadcn-fs",
    }));

    // Handle @/components/ui/* imports -> local <component>.tsx
    build.onResolve({ filter: /^@\/components\/ui\// }, (args) => {
      const componentName = args.path.replace(/^@\/components\/ui\//, "");
      return {
        path: join(shadcnPath, "components", "ui", `${componentName}.tsx`),
        namespace: "shadcn-fs",
      };
    });

    // Read local files and feed them to esbuild
    build.onLoad({ filter: /.*/, namespace: "shadcn-fs" }, async (args) => {
      try {
        const isTsx = /\.tsx$/.test(args.path);
        const loader: Loader = (isTsx ? "tsx" : "ts") as Loader;
        const contents = readFileSync(args.path, "utf-8");

        return {
          contents,
          loader,
        };
      } catch (error) {
        throw new Error(
          `Failed to read file ${args.path}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    });
  },
});
