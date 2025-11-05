import type { FeatureImplementation } from "@headless-tree/core";

export const customClickBehavior: FeatureImplementation = {
  itemInstance: {
    getProps: ({ prev }) => ({
      ...prev?.(),
      onClick: () => {},
    }),
  },
};
