import Link from "next/link";

import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site";

import { MainNav } from "./main-nav";
import { ThemeToggle } from "./theme-toggle";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4">
        <Link href={routes.home} className="font-semibold tracking-tight">
          {siteConfig.name}
        </Link>
        <div className="flex items-center gap-2">
          <MainNav />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
