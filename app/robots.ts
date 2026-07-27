import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

// Bắt buộc khi output: "export" — Next cần biết chắc file này dựng lúc build.
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: "/api/" }],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl("/").replace(/\/$/, ""),
  };
}
