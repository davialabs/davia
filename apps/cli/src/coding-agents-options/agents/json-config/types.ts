export interface JsonConfigFile {
  folderPath: string;
  fileName: string;
  defaultContent: Record<string, unknown>;
  appendTo: {
    path: string; // dot-notation path to the array (e.g., "instructions" or "permissions.allow")
    value: string; // value to add to the array
  };
}

