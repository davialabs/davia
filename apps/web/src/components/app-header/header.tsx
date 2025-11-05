"use client";

import { MobileTitle } from "./mobile-title";
import { NavigationBreadcrumb } from "./navigation-breadcrumb";
import { ThemeSwitcher } from "./theme-switcher";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";

export function Header() {
  const isMobile = useIsMobile();

  return (
    <header className="flex sticky top-0 z-45 h-14 shrink-0 items-center gap-2 border-b px-3 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="flex flex-1 items-center gap-2">
        <SidebarTrigger />
        <Separator
          orientation="vertical"
          className="mr-2 data-[orientation=vertical]:h-4"
        />
        {isMobile ? <MobileTitle /> : <NavigationBreadcrumb />}
      </div>
      <div className="ml-auto">
        <ThemeSwitcher />
      </div>
    </header>
  );
}
