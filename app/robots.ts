import type { MetadataRoute } from "next";
import { env } from "@/config/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/login", "/register"],
      disallow: ["/dashboard", "/products", "/stores", "/ads", "/analytics", "/billing", "/settings", "/admin", "/api"],
    },
    sitemap: `${env.appUrl}/sitemap.xml`,
  };
}
