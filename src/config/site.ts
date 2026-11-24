import { env } from "./env";
import { routes } from "./routes";

/**
 * Static, app-wide site configuration. Used for metadata, navigation,
 * sitemap, manifest, and anywhere the product name or URL appears.
 */
export const siteConfig = {
  name: "Zed Next",
  shortName: "Zed",
  description:
    "An enterprise-grade, feature-based Next.js starter with batteries included.",
  url: env.NEXT_PUBLIC_APP_URL,
  locale: "en_US",
  links: {
    repo: "https://github.com/pushpa1105/zed-next",
  },
  nav: [
    { title: "Home", href: routes.home },
    { title: "Todos", href: routes.todos },
  ],
} as const;

export type SiteConfig = typeof siteConfig;
