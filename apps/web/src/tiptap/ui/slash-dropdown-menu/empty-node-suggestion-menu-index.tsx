export { EmptyNodeSuggestionMenu } from "./empty-node-suggestion-menu";

// Re-export types from original suggestion menu
export type {
  SuggestionItem,
  SuggestionMenuProps,
  SuggestionMenuRenderProps,
} from "@/tiptap/ui-utils/suggestion-menu";

// Re-export utility functions from original suggestion menu
export {
  calculateStartPosition,
  filterSuggestionItems,
} from "@/tiptap/ui-utils/suggestion-menu";
