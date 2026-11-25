import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/crew/login/", "/login/", "/crew/new/", "/offline/", "/check/result/"] }],
    sitemap: "https://re-boot.kr/sitemap.xml",
    host: "https://re-boot.kr",
  };
}
