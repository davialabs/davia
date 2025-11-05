import { Extension } from "@tiptap/core";

export interface UiState {
  lockDragHandle: boolean;
  isDragging: boolean;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    uiState: {
      setLockDragHandle: (value: boolean) => ReturnType;
      resetUiState: () => ReturnType;
      setIsDragging: (value: boolean) => ReturnType;
    };
  }

  interface Storage {
    uiState: UiState;
  }
}

export const defaultUiState: UiState = {
  lockDragHandle: false,
  isDragging: false,
} as const;

export const UiStateExtension = Extension.create<UiState>({
  name: "uiState",

  addStorage() {
    return {
      uiState: { ...defaultUiState },
    };
  },

  addCommands() {
    const createBooleanSetter =
      (key: keyof UiState) => (value: boolean) => () => {
        this.storage[key] = value;
        return true;
      };

    return {
      // Drag handle commands
      setLockDragHandle: createBooleanSetter("lockDragHandle"),
      setIsDragging: createBooleanSetter("isDragging"),

      // Reset command
      resetUiState: () => () => {
        Object.assign(this.storage, { ...defaultUiState });
        return true;
      },
    };
  },

  onCreate() {
    this.storage = { ...defaultUiState };
  },
});
