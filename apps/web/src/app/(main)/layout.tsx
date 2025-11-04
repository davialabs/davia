import { readFileSync, readdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

// Find monorepo root
function findMonorepoRoot(startPath: string): string {
  let current = startPath;
  while (current !== dirname(current)) {
    if (
      existsSync(join(current, "pnpm-workspace.yaml")) ||
      existsSync(join(current, "turbo.json"))
    ) {
      return current;
    }
    current = dirname(current);
  }
  return startPath;
}

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get the current file path and find monorepo root
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const monorepoRoot = findMonorepoRoot(__dirname);

  // Read state.json
  const stateJsonPath = join(monorepoRoot, ".davia", "state.json");
  let state = {};
  try {
    const stateContent = readFileSync(stateJsonPath, "utf-8");
    if (stateContent.trim()) {
      state = JSON.parse(stateContent);
    }
  } catch (error) {
    console.error("Error reading state.json:", error);
  }

  // Read assets folder
  const assetsPath = join(monorepoRoot, ".davia", "assets");
  let assets: string[] = [];
  try {
    assets = readdirSync(assetsPath);
  } catch (error) {
    console.error("Error reading assets folder:", error);
  }

  console.log("State:", state);
  console.log("Assets:", assets);

  return (
    <SidebarProvider>
      <AppSidebar state={state} assets={assets} />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2">
          <div className="flex flex-1 items-center gap-2 px-3">
            <SidebarTrigger />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
          </div>
          <div className="ml-auto px-3">{/* <NavActions /> */}</div>
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
