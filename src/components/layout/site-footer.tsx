import { siteConfig } from "@/config/site";

export function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="container mx-auto flex max-w-5xl flex-col items-center justify-between gap-2 px-4 py-6 text-sm text-muted-foreground sm:flex-row">
        <p>{siteConfig.name}</p>
        <a
          href={siteConfig.links.repo}
          target="_blank"
          rel="noreferrer"
          className="hover:text-foreground"
        >
          Source
        </a>
      </div>
    </footer>
  );
}
