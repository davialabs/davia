import type { JsonConfigFile } from "./json-config/types.js";

export interface AgentConfig {
  name: string;
  folderPath: string;
  fileName: string;
  frontmatter: string;
  jsonConfigs?: JsonConfigFile[];
}
