import Link from "next/link";
import type { Metadata } from "next";
import { INGREDIENTS } from "@/content/ingredients";
import { PRODUCTS } from "@/content/products";
import { BuyChecker } from "@/components/buy-checker";
import { ProductPicks } from "@/components/product-picks";

export const metadata: Metadata = { title: "SELECT", description: "성분을 기준으로 고른 예시 제품. 수수료가 아니라 성분이 먼저예요." };

const PRINCIPLES = [
  ["성분이 먼저, 제품은 나중", "피부 타입 · 고민 → 성분 → 그 성분의 대표 제품 순서로 보여 줘요. 수수료 유무로 목록을 바꾸지 않아요."],
  ["제휴는 숨기지 않아요", "쿠팡 파트너스 링크가 있는 제품은 목록 위에 제휴 사실을 먼저 적고, 링크마다 '제휴' 표시를 달아요."],
  ["팔지 않는 것도 말해요", "과장 광고 성분, 처방이 필요한 의약품, 피부과 시술은 링크를 걸지 않아요."],
];

export default function SelectPage() {
  const groups = INGREDIENTS.map((i) => ({ i, items: PRODUCTS.filter((p) => p.ingredient === i.slug) })).filter((g) => g.items.length > 0);
  return (
    <div className="wrap py-14 md:py-20">
      <p className="eyebrow">SELECT <span className="badge badge-draft ml-2">v1 · 성분별 예시</span></p>
      <h1 className="h1 mt-3">많이 파는 것보다,<br />맞게 고르는 것.</h1>
      <p className="lead mt-4 max-w-xl">성분을 먼저 고르고, 그 성분으로 많이 알려진 제품을 예시로 보여 드려요. 순위도, 효과 보증도 아니에요.</p>

      <div className="mt-6 flex flex-wrap gap-2">
        <Link href="/skin/" className="btn btn-dark !min-h-11">내 피부 타입부터</Link>
        <Link href="/ingredients/" className="btn btn-ghost !min-h-11">성분 사전 보기</Link>
      </div>

      <BuyChecker />

      <ul className="mt-12 grid gap-6 md:grid-cols-3">
        {PRINCIPLES.map(([t, d]) => (
          <li key={t} className="border-t-2 border-ink pt-4">
            <p className="font-bold">{t}</p>
            <p className="small mt-2">{d}</p>
          </li>
        ))}
      </ul>

      <div className="mt-14 grid gap-12">
        {groups.map(({ i, items }) => (
          <section key={i.slug} id={i.slug} className="scroll-mt-24">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="h3">{i.ko}</h2>
              <Link href={`/ingredients/${i.slug}/`} className="small link">성분 설명 · 주의할 점 →</Link>
            </div>
            <p className="small mt-1">{i.role}</p>
            <div className="mt-4"><ProductPicks items={items} /></div>
          </section>
        ))}
      </div>

      <p className="small mt-12">관련 정책: <Link href="/legal/advertising/" className="link">광고 · 협찬 · 제휴 표시 정책(초안)</Link> · 일반 정보이며 진단 · 치료를 대신하지 않아요.</p>
    </div>
  );
}
