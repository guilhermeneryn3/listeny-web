import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: "https://listeny.app/sitemap.xml",
    host: "https://listeny.app",
  };
}
