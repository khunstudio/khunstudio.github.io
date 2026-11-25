import type { MetadataRoute } from "next";
import { GUIDES } from "@/content/guides";
import { INGREDIENTS } from "@/content/ingredients";

export const dynamic = "force-static";

const BASE = "https://re-boot.kr";
// 공개 페이지만 담는다 (로그인 · 글쓰기 · 개인 기록 화면 제외)
const PAGES = ["/", "/care/", "/skin/", "/ingredients/", "/check/", "/start/", "/routine/", "/goals/", "/crew/", "/select/", "/brand/", "/about/", "/partnership/", "/legal/privacy/", "/legal/terms/", "/legal/community/", "/legal/advertising/"];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    ...PAGES.map((p) => ({ url: `${BASE}${p}`, lastModified: now, changeFrequency: "weekly" as const, priority: p === "/" ? 1 : 0.7 })),
    ...GUIDES.map((g) => ({ url: `${BASE}/care/${g.slug}/`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.6 })),
    ...INGREDIENTS.map((i) => ({ url: `${BASE}/ingredients/${i.slug}/`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.5 })),
  ];
}
