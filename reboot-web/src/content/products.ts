import { PARTNER_LINKS } from "./partner-links.generated.ts";

// 성분별 "많이 알려진 예시 제품". 추천 순위가 아니라, 그 성분을 내세운 대표적인 제품을 보여 주는 목록이다.
// - 고르는 기준은 성분이며, 수수료 유무로 넣거나 빼지 않는다.
// - partnerUrl: 쿠팡 파트너스에서 직접 만든 링크(link.coupang.com/a/...)를 붙여 넣으면 그대로 쓴다.
// - 없으면 빌드 때 scripts/partner-links.mts가 API로 만든 링크(PARTNER_LINKS)를 쓰고, 그것도 없으면 일반 검색으로 연결한다.
// - coupangUrl: 정확한 상품 페이지 주소. 있으면 자동 링크가 검색 결과 대신 이 페이지로 간다.
// - 제품 처방은 바뀔 수 있으므로 화면에 "구매 전 전성분 확인"을 함께 보여 준다.

export interface Product {
  id: string;
  /** 성분 slug (content/ingredients.ts) */
  ingredient: string;
  brand: string;
  name: string;
  /** 제형 · 단계 */
  kind: string;
  /** 왜 이 성분의 예시로 많이 언급되는지 한 줄 */
  note: string;
  /** 쿠팡 파트너스 링크 (있을 때만 제휴 표시) */
  partnerUrl?: string;
  /** 쿠팡 상품 페이지 주소 (자동 링크 생성용) */
  coupangUrl?: string;
}

export const PRODUCTS: Product[] = [
  { id: "to-niacinamide", ingredient: "niacinamide", brand: "디오디너리", name: "나이아신아마이드 10% + 징크 1%", kind: "세럼", note: "농도가 이름에 그대로 적힌, 가장 많이 알려진 나이아신아마이드 세럼" },
  { id: "pc-bha", ingredient: "salicylic-acid", brand: "폴라초이스", name: "스킨 퍼펙팅 2% BHA 리퀴드 엑스폴리언트", kind: "토너 · 리퀴드", note: "살리실산 2% 리퀴드의 대명사 격인 제품" },
  { id: "to-glycolic", ingredient: "aha", brand: "디오디너리", name: "글라이콜릭 애시드 7% 토닝 솔루션", kind: "토너", note: "글라이콜릭산(AHA) 토너로 많이 언급돼요" },
  { id: "to-azelaic", ingredient: "azelaic-acid", brand: "디오디너리", name: "아젤라익 애시드 서스펜션 10%", kind: "크림", note: "화장품으로 쉽게 구할 수 있는 아젤라산 제품 중 가장 유명해요" },
  { id: "iope-retinol", ingredient: "retinol", brand: "아이오페", name: "레티놀 엑스퍼트 0.1%", kind: "크림", note: "농도를 표기한 국내 레티놀 크림으로 잘 알려져 있어요" },
  { id: "to-retinol", ingredient: "retinol", brand: "디오디너리", name: "레티놀 0.5% 인 스쿠알란", kind: "오일 세럼", note: "농도별로 고를 수 있는 레티놀 입문 제품" },
  { id: "klairs-vitc", ingredient: "vitamin-c", brand: "클레어스", name: "프레쉬리 쥬스드 비타민 드롭", kind: "세럼", note: "저농도 순수 비타민 C로 순하게 시작하는 제품으로 알려져 있어요" },
  { id: "aestura-atobarrier", ingredient: "ceramide", brand: "에스트라", name: "아토베리어365 크림", kind: "크림", note: "세라마이드 장벽 크림으로 국내에서 가장 많이 언급되는 제품 중 하나" },
  { id: "cerave-cream", ingredient: "ceramide", brand: "세라비", name: "모이스처라이징 크림", kind: "크림", note: "세라마이드 3종을 내세운 대용량 보습 크림" },
  { id: "lrp-cicaplast", ingredient: "panthenol", brand: "라로슈포제", name: "시카플라스트 밤 B5+", kind: "밤", note: "판테놀(B5) 진정 밤의 대표 제품. 면도 후 붉어질 때 많이 써요" },
  { id: "skin1004-centella", ingredient: "centella", brand: "스킨1004", name: "마다가스카르 센텔라 앰플", kind: "앰플", note: "병풀 추출물 단일 앰플로 유명해요" },
  { id: "drjart-cicapair", ingredient: "centella", brand: "닥터자르트", name: "시카페어 크림", kind: "크림", note: "'시카 크림'을 대중화한 제품" },
  { id: "torriden-divein", ingredient: "hyaluronic-acid", brand: "토리든", name: "다이브인 저분자 히알루론산 세럼", kind: "세럼", note: "히알루론산 세럼으로 국내에서 많이 알려진 제품" },
  { id: "to-ha", ingredient: "hyaluronic-acid", brand: "디오디너리", name: "히알루로닉 애시드 2% + B5", kind: "세럼", note: "히알루론산과 판테놀을 함께 넣은 기본 세럼" },
  { id: "to-arbutin", ingredient: "arbutin", brand: "디오디너리", name: "알파 알부틴 2% + HA", kind: "세럼", note: "알파 알부틴 농도를 표기한 대표 제품" },
  { id: "to-buffet", ingredient: "peptides", brand: "디오디너리", name: "뷔페 (멀티 펩타이드 세럼)", kind: "세럼", note: "여러 펩타이드를 한 병에 담은 제품으로 알려져 있어요" },
  { id: "to-squalane", ingredient: "squalane", brand: "디오디너리", name: "100% 식물성 스쿠알란", kind: "오일", note: "스쿠알란 단일 오일. 크림에 한두 방울 섞어 써요" },
  { id: "eucerin-urea", ingredient: "urea", brand: "유세린", name: "우레아리페어 플러스 로션 5%", kind: "바디 · 로션", note: "우레아 농도를 표기한 보습 로션. 팔 · 다리 각질에 많이 써요" },
  { id: "tbs-teatree", ingredient: "tea-tree", brand: "더바디샵", name: "티트리 오일", kind: "오일 (부분용)", note: "티트리 오일로 가장 많이 알려진 제품. 원액을 넓게 바르지 말고 부분에만" },
  { id: "vt-reedle100", ingredient: "spicule", brand: "VT", name: "리들샷 100 에센스", kind: "에센스", note: "스피큘 화장품을 대중화한 제품. 숫자가 낮은 100부터 시작해요" },
];

// 빌드 때 생성된 파트너스 링크를 합친다 (직접 넣은 partnerUrl이 우선)
for (const p of PRODUCTS) if (!p.partnerUrl && PARTNER_LINKS[p.id]) p.partnerUrl = PARTNER_LINKS[p.id];

export const productsFor = (slug: string) => PRODUCTS.filter((p) => p.ingredient === slug);

/** 파트너스 링크가 없으면 쿠팡 일반 검색으로 연결 (수수료 없음) */
export const productHref = (p: Product) => p.partnerUrl ?? `https://www.coupang.com/np/search?q=${encodeURIComponent(`${p.brand} ${p.name}`)}`;

export const PARTNER_DISCLOSURE = "이 링크는 쿠팡 파트너스 활동의 일환으로, 구매가 이뤄지면 RE:BOOT가 일정액의 수수료를 받을 수 있어요. 가격은 같아요.";
