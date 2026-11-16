import type { MetadataRoute } from "next";
import { DEFAULT_SITE_CONTENT } from "@/lib/default-site-content";
import { fetchPublicSiteContent, fetchPublishedBlogSlugs } from "@/lib/site-content-server";
import { siteBaseUrl } from "@/lib/site-url";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = (await fetchPublicSiteContent()) ?? DEFAULT_SITE_CONTENT;
  const blogSlugs = await fetchPublishedBlogSlugs();
  const publicPaths = [
    "",
    "/about",
    "/services",
    "/pricing",
    "/contact",
    "/blog",
    "/store",
    "/partner-register",
    ...site.services.map((service) => `/services/${encodeURIComponent(service.id)}`),
    ...blogSlugs.map((slug) => `/blog/${encodeURIComponent(slug)}`),
  ];
  const lastModified = site.updatedAt ? new Date(site.updatedAt) : new Date();

  return [
    ...publicPaths.map((path) => ({
      url: new URL(path, siteBaseUrl).toString(),
      lastModified,
    })),
    ...site.projects.map((project) => ({
      url: new URL(`/projects/${encodeURIComponent(project.id)}`, siteBaseUrl).toString(),
      lastModified,
    })),
  ];
}
