import type { MetadataRoute } from "next";

import { publicRoutes, routes } from "@/config/routes";
import { siteConfig } from "@/config/site";

/** Lists public pages from `publicRoutes`, or generate entries from your data. */
export default function sitemap(): MetadataRoute.Sitemap {
  return publicRoutes.map((path) => ({
    url: new URL(path, siteConfig.url).toString(),
    changeFrequency: "weekly",
    priority: path === routes.home ? 1 : 0.7,
  }));
}
