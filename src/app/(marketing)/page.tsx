import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site";

import { FeatureGrid } from "./_components/feature-grid";

export default function HomePage() {
  return (
    <div className="container mx-auto max-w-5xl px-4">
      <section className="flex flex-col items-center gap-6 py-20 text-center sm:py-28">
        <span className="rounded-full border px-3 py-1 text-xs text-muted-foreground">
          Next.js 16 · React 19 · Tailwind CSS 4 · TypeScript
        </span>
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-balance sm:text-6xl">
          Ship faster with a structure that scales.
        </h1>
        <p className="max-w-2xl text-lg text-pretty text-muted-foreground">
          {siteConfig.description} Feature-based architecture, strict typing, testing, CI
          and documentation are ready from day one.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href={routes.todos} className={buttonVariants({ size: "lg" })}>
            See the example feature
          </Link>
          <a
            href={siteConfig.links.repo}
            target="_blank"
            rel="noreferrer"
            className={buttonVariants({ size: "lg", variant: "outline" })}
          >
            Read the docs
          </a>
        </div>
      </section>

      <FeatureGrid />
    </div>
  );
}
