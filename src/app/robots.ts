import type { MetadataRoute } from "next";
import { siteBaseUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/projects/", "/services/", "/blog/"],
      disallow: ["/admin/", "/partner/", "/login", "/inbox", "/profile"],
    },
    sitemap: new URL("/sitemap.xml", siteBaseUrl).toString(),
  };
}
