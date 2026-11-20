// 빌드 직전에 실행: 제품 목록을 쿠팡 파트너스 링크로 바꿔 src/content/partner-links.generated.ts에 쓴다.
// - 키는 Vercel 환경 변수 COUPANG_ACCESS_KEY / COUPANG_SECRET_KEY 에서만 읽는다 (코드 · 저장소에 두지 않음).
// - 제품에 coupangUrl(상품 페이지)이 있으면 그 페이지를, 없으면 "브랜드 + 제품명" 검색 결과 페이지를 링크로 만든다.
// - 어떤 이유로든 실패하면 기존 파일을 그대로 두고 빌드는 계속한다.
import { createHmac } from "node:crypto";
import { writeFileSync } from "node:fs";
import { PRODUCTS } from "../src/content/products.ts";

const AK = process.env.COUPANG_ACCESS_KEY;
const SK = process.env.COUPANG_SECRET_KEY;
const OUT = new URL("../src/content/partner-links.generated.ts", import.meta.url);
const HOST = "https://api-gateway.coupang.com";
const PATH = "/v2/providers/affiliate_open_api/apis/openapi/v1/deeplink";

function auth(method: string, path: string, query = ""): string {
  const d = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z").slice(2); // yyMMddTHHmmssZ
  const sig = createHmac("sha256", SK!).update(d + method + path + query).digest("hex");
  return `CEA algorithm=HmacSHA256, access-key=${AK}, signed-date=${d}, signature=${sig}`;
}

const target = (p: (typeof PRODUCTS)[number]) =>
  p.coupangUrl ?? `https://www.coupang.com/np/search?q=${encodeURIComponent(`${p.brand} ${p.name}`)}`;

async function main() {
  if (!AK || !SK) { console.log("[partner-links] 키가 없어 건너뜀 (일반 검색 링크 사용)"); return; }
  const items = PRODUCTS.filter((p) => !p.partnerUrl);
  const links: Record<string, string> = {};
  // 한 번에 최대 20개씩
  for (let i = 0; i < items.length; i += 20) {
    const chunk = items.slice(i, i + 20);
    const res = await fetch(HOST + PATH, {
      method: "POST",
      headers: { Authorization: auth("POST", PATH), "Content-Type": "application/json;charset=UTF-8" },
      body: JSON.stringify({ coupangUrls: chunk.map(target) }),
    });
    const json = (await res.json()) as { rCode?: string; rMessage?: string; data?: { originalUrl: string; shortenUrl: string }[] };
    if (!res.ok || json.rCode !== "0" || !json.data) throw new Error(`deeplink 실패: ${res.status} ${json.rCode ?? ""} ${json.rMessage ?? ""}`);
    for (const p of chunk) {
      const hit = json.data.find((d) => d.originalUrl === target(p)) ?? json.data[chunk.indexOf(p)];
      if (hit?.shortenUrl) links[p.id] = hit.shortenUrl;
    }
  }
  const body = `// 자동 생성 파일 (scripts/partner-links.mts). 직접 고치지 마세요.\n// 생성: ${new Date().toISOString()}\nexport const PARTNER_LINKS: Record<string, string> = ${JSON.stringify(links, null, 2)};\n`;
  writeFileSync(OUT, body);
  console.log(`[partner-links] ${Object.keys(links).length}/${items.length}개 링크 생성`);
}

main().catch((e) => { console.warn("[partner-links] 건너뜀:", e instanceof Error ? e.message : e); });
