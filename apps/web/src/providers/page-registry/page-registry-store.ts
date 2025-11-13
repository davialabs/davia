import { createStore } from "zustand/vanilla";
import { devtools } from "zustand/middleware";
import { toast } from "sonner";

export type AssetEntry = {
  content: string | null;
  proposedContent: string | null;
  synced: boolean;
  error?: string;
};

export type PageRegistryState = {
  projectId: string;
  assets: Map<string, AssetEntry>; // keyed by path
  pendingAssetFetches: Map<string, Promise<AssetEntry>>; // dedupe concurrent fetches per path
};

export type PageRegistryActions = {
  ensureAsset(path: string): Promise<AssetEntry>;
  updateAssetContent(path: string, nextContent: string): void; // local update only
  updateAssetProposedContent(path: string, nextProposedContent: string): void; // update proposed content
  cleanup(): void;
};

export type PageRegistryStore = PageRegistryState & PageRegistryActions;

export const createPageRegistryStore = ({
  projectId,
}: {
  projectId: string;
}) => {
  return createStore<PageRegistryStore>()(
    devtools(
      (set, get) => ({
        projectId,
        assets: new Map(),
        pendingAssetFetches: new Map(),

        ensureAsset: async (path: string) => {
          const existing = get().assets.get(path);
          if (existing && existing.synced) {
            return existing;
          }

          const pending = get().pendingAssetFetches.get(path);
          if (pending) {
            return pending;
          }

          const fetchPromise = (async () => {
            const projectId = get().projectId;
            const params = new URLSearchParams({
              projectId,
              path,
            });
            const response = await fetch(`/api/content?${params.toString()}`);

            let entry: AssetEntry;
            if (!response.ok) {
              const errorData = await response.json().catch(() => ({}));
              entry = {
                content: null,
                proposedContent: null,
                synced: false,
                error:
                  errorData.error ||
                  `Failed to fetch content: ${response.statusText}`,
              };
            } else {
              const data = await response.json();
              entry = {
                content: data.content ?? null,
                proposedContent: data.proposedContent ?? null,
                synced: true,
              };
            }

            set((s) => {
              const nextAssets = new Map(s.assets);
              nextAssets.set(path, entry);
              const nextPending = new Map(s.pendingAssetFetches);
              nextPending.delete(path);
              return { assets: nextAssets, pendingAssetFetches: nextPending };
            });

            return entry;
          })();

          set((s) => ({
            pendingAssetFetches: new Map(s.pendingAssetFetches).set(
              path,
              fetchPromise
            ),
          }));

          try {
            return await fetchPromise;
          } catch (err) {
            set((s) => {
              const nextPending = new Map(s.pendingAssetFetches);
              nextPending.delete(path);
              return {
                pendingAssetFetches: nextPending,
              };
            });
            throw err;
          }
        },

        updateAssetContent: async (path: string, nextContent: string) => {
          const projectId = get().projectId;
          const response = await fetch("/api/content", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              projectId,
              path,
              content: nextContent,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            toast.error(errorData.error || "Failed to update data");
            return;
          }

          // Reflect locally
          set((s) => {
            const nextAssets = new Map(s.assets);
            const current = nextAssets.get(path);
            nextAssets.set(path, {
              content: nextContent,
              proposedContent: current?.proposedContent ?? null,
              synced: true,
              error: current?.error,
            });
            return { assets: nextAssets };
          });
        },

        updateAssetProposedContent: async (
          path: string,
          nextProposedContent: string
        ) => {
          const projectId = get().projectId;
          const response = await fetch("/api/content", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              projectId,
              path,
              content: get().assets.get(path)?.content ?? "",
              proposedContent: nextProposedContent,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            toast.error(errorData.error || "Failed to update proposed data");
            return;
          }

          // Reflect locally
          set((s) => {
            const nextAssets = new Map(s.assets);
            const current = nextAssets.get(path);
            nextAssets.set(path, {
              content: current?.content ?? null,
              proposedContent: nextProposedContent,
              synced: true,
              error: current?.error,
            });
            return { assets: nextAssets };
          });
        },

        cleanup: () => {
          set({
            assets: new Map(),
            pendingAssetFetches: new Map(),
          });
        },
      }),
      { name: "PageRegistryStore" }
    )
  );
};
