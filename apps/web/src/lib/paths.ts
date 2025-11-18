"use server";

import envPaths from "env-paths";
import path from "node:path";
import fs from "fs-extra";

const paths = envPaths("davia", { suffix: "" });

/**
 * Ensures the data directory exists and returns the path to projects.json
 */
export async function getProjectsPath(): Promise<string> {
  await fs.ensureDir(paths.data);
  return path.join(paths.data, "projects.json");
}
