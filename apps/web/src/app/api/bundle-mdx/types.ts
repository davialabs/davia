import { bundleMDX } from "mdx-bundler";

export type Source = {
  code: string;
  path: string;
};

export type SourceCollector = {
  add: (source: Source) => void;
};

export type DataCollector = Set<string>;

export interface BundlingResult {
  result: Awaited<ReturnType<typeof bundleMDX>>;
  dataImports: string[];
}
