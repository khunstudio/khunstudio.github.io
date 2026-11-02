import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GUIDES, getGuide } from "@/content/guides";
import { GuideBrowser, GuideCard } from "@/components/guide-browser";
import { AREAS, AREA_ORDER, MODES } from "@/lib/labels";
import type { Area } from "@/lib/types";

const isArea = (s: string): s is Area => (AREA_ORDER as string[]).includes(s);

export function generateStaticParams() {
  return [...AREA_ORDER.map((slug) => ({ slug })), ...GUIDES.map((g) => ({ slug: g.slug }))];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  if (isArea(slug)) return { title: `${AREAS[slug].en} 가이드` };
  const g = getGuide(slug);
  return g ? { title: g.title, description: g.summary } : {};
}

export default async function CareSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  if (isArea(slug)) {
    return (
      <div className="wrap py-10 md:py-14">
        <Link href="/care/" className="small">← CARE</Link>
        <p className="eyebrow mt-6">{AREAS[slug].en}</p>
        <h1 className="h1 mt-2">{AREAS[slug].ko} 가이드</h1>
        <p className="lead mt-3">{AREAS[slug].desc}</p>
        <div className="mt-8"><GuideBrowser initialArea={slug} /></div>
      </div>
    );
  }

  const g = getGuide(slug);
  if (!g) notFound();
  const related = GUIDES.filter((x) => x.slug !== g.slug && (x.area === g.area || x.modes.some((m) => g.modes.includes(m)))).slice(0, 3);

  return (
    <article>
      <header className="border-b border-line">
        <div className="wrap-narrow py-8 md:py-12">
          <Link href={`/care/${g.area}/`} className="small">← {AREAS[g.area].en} · {AREAS[g.area].ko}</Link>
          <p className="eyebrow mt-6">{g.kicker}</p>
          <h1 className="h1 mt-2">{g.title}</h1>
          <p className="lead mt-4">{g.summary}</p>
          <div className="mt-5 flex flex-wrap items-center gap-2 text-[12.5px] text-mute">
            {g.review === "draft" ? <span className="badge badge-draft">전문가 검수 전 · 일반 정보</span> : <span className="badge badge-ink">검수 완료 · {g.reviewer}</span>}
            <span>읽는 시간 {g.read}분</span>
            <span aria-hidden="true">·</span>
            <span>작성 {g.updated}</span>
          </div>
          <p className="mt-3 flex flex-wrap gap-1.5">
            {g.modes.map((m) => <span key={m} className="rounded-full bg-sand px-2.5 py-0.5 text-[12px] text-mute">{MODES[m].ko}</span>)}
          </p>
        </div>
      </header>

      <div className="wrap-narrow py-8">
        {g.medicalNotice && (
          <div className="notice notice-warn mb-6"><p>이 글은 상담을 준비하기 위한 정보예요. 진단 · 치료 · 병원 추천을 하지 않으며, 증상에 대한 판단은 의료진과 상의해 주세요.</p></div>
        )}
        <div className="prose-r">
          {g.sections.map((s) => (
            <section key={s.h}>
              <h2>{s.h}</h2>
              {s.p?.map((t) => <p key={t}>{t}</p>)}
              {s.list && <ul>{s.list.map((t) => <li key={t}>{t}</li>)}</ul>}
              {s.steps && <ol>{s.steps.map((t) => <li key={t}>{t}</li>)}</ol>}
            </section>
          ))}
        </div>

        {g.checklist && (
          <div className="mt-10 rounded-[12px] bg-sand p-6">
            <p className="eyebrow">CHECKLIST</p>
            <p className="h3 mt-1">{g.checklist.title}</p>
            <ul className="mt-4 grid gap-2.5">
              {g.checklist.items.map((t) => (
                <li key={t} className="flex items-center gap-3 text-[15px]"><span className="h-5 w-5 flex-none rounded-[5px] border-[1.5px] border-[#bdbcb7] bg-white" aria-hidden="true" />{t}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="band-ink mt-10 rounded-[12px] p-6">
          <p className="h3">읽은 내용을 루틴으로 옮겨 볼까요?</p>
          <p className="mt-2 text-[14px] text-ink-mute">30초 체크로 지금 할 수 있는 만큼만 루틴을 만들어요.</p>
          <Link href="/check/" className="btn btn-primary mt-5">30초 체크</Link>
        </div>

        <p className="small mt-8">일반적인 생활 관리 정보이며 개인의 상태를 진단하지 않습니다. 불편함이 계속되면 의료기관에 상담해 주세요. 내용 오류 제보는 <Link href="/partnership/" className="link">문의</Link>로 알려 주세요.</p>
      </div>

      {related.length > 0 && (
        <section className="border-t border-line bg-sand/60">
          <div className="wrap py-10">
            <h2 className="sec-head h3">함께 읽기</h2>
            <ul className="grid gap-3 md:grid-cols-3">{related.map((r) => <li key={r.slug}><GuideCard g={r} /></li>)}</ul>
          </div>
        </section>
      )}
    </article>
  );
}
