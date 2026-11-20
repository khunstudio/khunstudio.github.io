"use client";

import { PARTNER_DISCLOSURE, productHref, type Product } from "@/content/products";
import { track } from "@/lib/analytics";

// 성분 페이지 · SELECT에서 쓰는 예시 제품 목록. 제휴 링크가 하나라도 있으면 목록 위에 표시를 먼저 보여 준다.
export function ProductPicks({ items, showIngredient }: { items: Product[]; showIngredient?: (p: Product) => string }) {
  if (!items.length) return null;
  const hasPartner = items.some((p) => p.partnerUrl);
  return (
    <div>
      {hasPartner && <p className="notice !py-3 text-[13.5px]"><b>제휴 링크 포함</b> · {PARTNER_DISCLOSURE}</p>}
      <ul className="mt-3 grid gap-2.5 sm:grid-cols-2">
        {items.map((p) => (
          <li key={p.id} className="card flex flex-col p-5">
            <p className="small !text-[12px] font-semibold">{p.brand} · {p.kind}{showIngredient ? ` · ${showIngredient(p)}` : ""}</p>
            <p className="mt-1.5 font-bold leading-snug">{p.name}</p>
            <p className="small mt-2 flex-1">{p.note}</p>
            <div className="mt-4 flex items-center justify-between gap-2">
              <a
                href={productHref(p)} target="_blank" rel={p.partnerUrl ? "sponsored nofollow noopener" : "nofollow noopener"}
                className="btn btn-dark !min-h-10 !px-4 !text-[14px]"
                onClick={() => track("product_click", { item: p.id })}
              >
                {p.partnerUrl ? "쿠팡에서 보기" : "쿠팡에서 찾아보기"}
              </a>
              {p.partnerUrl && <span className="badge badge-draft">제휴</span>}
            </div>
          </li>
        ))}
      </ul>
      <p className="small mt-3">많이 알려진 예시일 뿐 순위나 효과 보증이 아니에요. 같은 성분이면 다른 제품도 괜찮아요. 처방이 바뀔 수 있으니 구매 전 전성분과 농도를 확인하세요.</p>
    </div>
  );
}
