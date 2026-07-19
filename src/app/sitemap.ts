import type { MetadataRoute } from "next";

const BASE = "https://educaty.app";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${BASE}/`, changeFrequency: "monthly", priority: 1 },
    { url: `${BASE}/criar`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/login`, changeFrequency: "yearly", priority: 0.3 },
  ];
}
