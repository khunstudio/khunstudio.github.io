import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { INGREDIENTS, getIngredient } from "@/content/ingredients";
import { SKIN_LABEL } from "@/lib/skintype";
import { productsFor } from "@/content/products";
import { ProductPicks } from "@/components/product-picks";

export function generateStaticParams() {
  return INGREDIENTS.map((i) => ({ slug: i.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const i = getIngredient(slug);
  return i ? { title: `${i.ko} · 성분 사전`, description: i.role } : {};
}

export default async function IngredientPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const i = getIngredient(slug);
  if (!i) notFound();
  const products = i.level === "처방" || i.level === "과장 주의" ? [] : productsFor(i.slug);
  const related = INGREDIENTS.filter((x) => x.slug !== i.slug && x.tags.some((t) => i.tags.includes(t))).slice(0, 4);
  return (
    <article className="wrap-narrow py-10 md:py-14">
      <Link href="/ingredients/" className="small">← 성분 사전</Link>
      <p className="eyebrow mt-6">{i.en}</p>
      <h1 className="h1 mt-2">{i.ko}</h1>
      <p className="lead mt-3">{i.role}</p>
      <div className="mt-4 flex flex-wrap gap-1.5">
        <span className="badge badge-draft">{i.level}</span>
        {i.evidence && <span className={`badge ${i.evidence === "탄탄" ? "badge-ok" : "badge-draft"}`}>근거 {i.evidence}</span>}
        {i.tags.map((t) => <span key={t} className="badge badge-draft">{t}</span>)}
      </div>
      {i.level === "처방" && <div className="notice notice-warn mt-6"><p>의약품이에요. 직접 구해서 쓰지 말고 피부과 진료 후 처방과 안내를 따라요.</p></div>}
      {i.verdict && <div className="notice notice-warn mt-6"><p><b>RE:BOOT 결론</b> · {i.verdict}</p></div>}

      <section className="mt-10"><h2 className="sec-head h3">무엇인가요</h2><p className="mt-3 leading-relaxed">{i.what}</p></section>
      <section className="mt-8"><h2 className="sec-head h3">피부에서 이렇게 작용해요</h2><p className="mt-3 leading-relaxed">{i.how}</p></section>
      <section className="mt-8">
        <h2 className="sec-head h3">이런 사람에게</h2>
        <p className="mt-3"><b>피부 타입</b> · {i.goodFor.map((k) => SKIN_LABEL[k]).join(" · ")}</p>
        <p className="mt-1"><b>고민</b> · {i.concerns.join(" · ")}</p>
      </section>
      <section className="mt-8"><h2 className="sec-head h3">이렇게 써요</h2><ul className="mt-3 grid gap-1.5">{i.use.map((t) => <li key={t}>· {t}</li>)}</ul></section>
      <section className="mt-8"><h2 className="sec-head h3">주의할 점</h2><ul className="mt-3 grid gap-1.5">{i.caution.map((t) => <li key={t}>· {t}</li>)}</ul></section>
      {(i.pair || i.avoid) && (
        <section className="mt-8 grid gap-3 sm:grid-cols-2">
          {i.pair && <div className="card p-4"><p className="eyebrow !text-[11px]">함께 쓰면 좋아요</p><p className="mt-2 text-[15px]">{i.pair.join(" · ")}</p></div>}
          {i.avoid && <div className="card p-4"><p className="eyebrow !text-[11px]">겹쳐 쓰지 않아요</p><p className="mt-2 text-[15px]">{i.avoid.join(" · ")}</p></div>}
        </section>
      )}
      {products.length > 0 && (
        <section className="mt-10">
          <h2 className="sec-head h3">이 성분, 이런 제품이 유명해요</h2>
          <p className="small -mt-2 mb-3">성분을 기준으로 고른 예시예요. 위의 &lsquo;주의할 점&rsquo;을 먼저 읽어 주세요.</p>
          <ProductPicks items={products} />
        </section>
      )}
      <div className="mt-10 rounded-[16px] bg-sand p-5">
        <p className="font-bold">내 피부에 맞는지 모르겠다면</p>
        <p className="small mt-1">6문항 셀프 체크로 피부 타입을 보고, 맞는 성분을 추천받아요.</p>
        <Link href="/skin/" className="btn btn-dark mt-4 !min-h-11">피부 타입 체크</Link>
      </div>
      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="h3">같이 보면 좋은 성분</h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {related.map((r) => <li key={r.slug}><Link href={`/ingredients/${r.slug}/`} className="card card-link block p-4"><span className="font-bold">{r.ko}</span><span className="small mt-1 block">{r.role}</span></Link></li>)}
          </ul>
        </section>
      )}
      <p className="small mt-10">일반 정보이며 진단 · 치료를 대신하지 않아요. 전문가 검수 전.</p>
    </article>
  );
}
