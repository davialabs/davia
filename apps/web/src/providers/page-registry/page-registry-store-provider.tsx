"use client";

import { type ReactNode, createContext, useEffect, useRef, use } from "react";
import { useStore } from "zustand";
import {
  createPageRegistryStore,
  type PageRegistryStore,
} from "./page-registry-store";

export type PageRegistryStoreApi = ReturnType<typeof createPageRegistryStore>;

export const PageRegistryStoreContext = createContext<
  PageRegistryStoreApi | undefined
>(undefined);

export const PageRegistryStoreProvider = ({
  projectId,
  children,
}: {
  projectId: string;
  children: ReactNode;
}) => {
  const storeRef = useRef<PageRegistryStoreApi | null>(null);
  if (storeRef.current === null) {
    storeRef.current = createPageRegistryStore({
      projectId,
    });
  }

  useEffect(() => {
    return () => {
      storeRef.current?.getState().cleanup();
    };
  }, []);

  return (
    <PageRegistryStoreContext value={storeRef.current}>
      {children}
    </PageRegistryStoreContext>
  );
};

export const usePageRegistryStore = <T,>(
  selector: (store: PageRegistryStore) => T
): T => {
  const context = use(PageRegistryStoreContext);

  if (!context) {
    throw new Error(
      `usePageRegistryStore must be used within PageRegistryStoreProvider`
    );
  }

  return useStore(context, selector);
};
