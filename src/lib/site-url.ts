const configuredSiteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "https://rakibulhaque.com");

export const siteBaseUrl = new URL(
  configuredSiteUrl.startsWith("http") ? configuredSiteUrl : `https://${configuredSiteUrl}`
);
