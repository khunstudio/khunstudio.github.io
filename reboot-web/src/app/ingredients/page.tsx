import Link from "next/link";
import type { Metadata } from "next";
import { INGREDIENTS } from "@/content/ingredients";

export const metadata: Metadata = { title: "성분 사전", description: "나이아신아마이드 · 레티놀 · 비타민 C · 아젤라익산 · 판테놀 등, 무엇이고 피부에서 어떻게 작용하는지." };

const LEVELS = ["입문", "중급", "처방"] as const;

export default function IngredientsPage() {
  return (
    <div className="wrap py-10 md:py-14">
      <p className="eyebrow">INGREDIENTS</p>
      <h1 className="h1 mt-3">포장 말고,<br />성분표로 고르는 남자.</h1>
      <p className="lead mt-4 max-w-2xl">'남성용'인지보다 중요한 건 뒷면에 무엇이 들어 있는지예요. 자주 보는 유효 성분이 무엇이고, 피부에서 어떻게 작용하고, 누구에게 맞는지 정리했어요.</p>
      <div className="mt-6 flex flex-wrap gap-2">
        <Link href="/skin/" className="btn btn-dark">내 피부 타입부터 체크</Link>
        <Link href="/care/ingredient-basics/" className="btn btn-line">성분표 읽는 법</Link>
      </div>
      {LEVELS.map((lv) => (
        <section key={lv} className="mt-12">
          <h2 className="sec-head h3">{lv === "입문" ? "입문 · 매일 써도 무난한 성분" : lv === "중급" ? "중급 · 사용법을 알고 쓰는 성분" : "처방 · 의사와 상의해서 쓰는 성분"}</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {INGREDIENTS.filter((i) => i.level === lv).map((i) => (
              <li key={i.slug}>
                <Link href={`/ingredients/${i.slug}/`} className="card card-link flex h-full flex-col p-5">
                  <span className="small !text-[12px]">{i.en}</span>
                  <span className="mt-1 text-[19px] font-bold tracking-tight">{i.ko}</span>
                  <span className="small mt-2 flex-1">{i.role}</span>
                  <span className="mt-4 flex flex-wrap gap-1">{i.tags.map((t) => <span key={t} className="badge badge-draft">{t}</span>)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <p className="small mt-12 max-w-2xl">일반적인 화장품 · 생활 관리 정보예요. 진단이나 치료를 대신하지 않고, 의약품은 의사 · 약사 안내를 따라요. 전문가 검수 전 내용이에요.</p>
    </div>
  );
}
