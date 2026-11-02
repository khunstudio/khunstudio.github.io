import Link from "next/link";
import { GUIDES } from "@/content/guides";
import { GuideCard } from "@/components/guide-browser";
import { HeroPreview, TodayStrip } from "@/components/home-today";
import { AREAS, AREA_ORDER, MODES, MODE_ORDER } from "@/lib/labels";

const FLOW = [
  { en: "CHECK", ko: "30초 체크", d: "생활 단계, 관심 영역, 쓸 수 있는 시간을 6개 질문으로 정리해요." },
  { en: "ROUTINE", ko: "나에게 맞는 루틴", d: "아침 · 저녁 루틴을 만들고, 오늘 상황에 맞게 바꾸고, 필요 없는 항목은 빼요." },
  { en: "RECORD", ko: "매일 기록", d: "체크한 날이 7일 · 30일 기록으로 쌓여요. 생활 단계가 바뀌어도 이어져요." },
];

export default function Home() {
  const latest = ["skin-basics", "shaving", "next-chapter"].map((s) => GUIDES.find((g) => g.slug === s)!);
  const service = ["px", "outdoor-day", "leave-prep", "before-enlistment"].map((s) => GUIDES.find((g) => g.slug === s)!);

  return (
    <>
      <TodayStrip />

      {/* 1. Hero */}
      <section className="band-ink overflow-hidden">
        <div className="wrap grid items-center gap-12 py-12 md:grid-cols-[1.25fr_1fr] md:py-20">
          <div>
            <p className="eyebrow">MEN&apos;S SELF-CARE · SKIN · BODY · STYLE · LIFE</p>
            <p className="display mt-5 text-[64px] sm:text-[92px] lg:text-[124px]" aria-hidden="true">
              RE<span className="colon">:</span>BOOT<br />YOURSELF.
            </p>
            <h1 className="mt-6 text-[24px] font-extrabold leading-snug tracking-tight sm:text-[30px]">보이고 싶은 모습부터, 다시 켜다.</h1>
            <p className="lead mt-4 max-w-[34rem]">
              피부 · 운동 · 스타일 · 생활 루틴을 30초 체크로 시작하고 매일 기록하세요.
              입대 전부터 복무 중, 전역 후, 그리고 그다음 일상까지 하나로 이어집니다.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/start/" className="btn btn-primary">무료로 시작하기</Link>
              <Link href="/care/" className="btn btn-line">가이드 먼저 보기</Link>
            </div>
            <p className="mt-4 text-[13px] text-ink-mute">로그인 없이 · 기록은 내 브라우저에만 저장</p>
          </div>
          <HeroPreview />
        </div>
      </section>

      {/* 2. 모드 */}
      <section className="wrap py-16 md:py-24">
        <p className="eyebrow">START WHERE YOU ARE</p>
        <h2 className="h2 mt-3">지금의 나에게 맞춰 시작하기</h2>
        <p className="lead mt-3 max-w-xl">어떤 시기든 같은 RE:BOOT를 써요. 단계가 바뀌면 추천만 바뀌고, 루틴과 기록은 그대로 이어져요.</p>
        <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {MODE_ORDER.map((m, i) => (
            <li key={m}>
              <Link href={`/check/?mode=${m}`} className="card card-link flex h-full flex-col p-6">
                <span className="display text-[15px] text-mute">0{i + 1}</span>
                <span className="eyebrow mt-6 !text-[11px]">{MODES[m].en}</span>
                <span className="mt-1 text-[21px] font-extrabold tracking-tight">{MODES[m].ko}</span>
                <span className="small mt-2 flex-1">{MODES[m].desc}</span>
                <span className="mt-6 text-[14px] font-bold text-signal-ink">이 단계로 시작 →</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* 3. 이용 흐름 */}
      <section className="band-sand">
        <div className="wrap py-16 md:py-24">
          <p className="eyebrow">HOW IT WORKS</p>
          <h2 className="h2 mt-3">체크하고, 루틴을 만들고, 기록하세요.</h2>
          <ol className="mt-10 grid gap-8 md:grid-cols-3 md:gap-6">
            {FLOW.map((f, i) => (
              <li key={f.en} className="border-t-2 border-ink pt-5">
                <p className="display text-[44px] leading-none">{f.en}<span className="colon">{i < 2 ? ":" : "."}</span></p>
                <p className="h3 mt-4">{f.ko}</p>
                <p className="small mt-2 !text-[15px]">{f.d}</p>
              </li>
            ))}
          </ol>
          <Link href="/start/" className="btn btn-dark mt-10">30초 체크 시작</Link>
        </div>
      </section>

      {/* 4. CARE */}
      <section className="wrap py-16 md:py-24">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">CARE</p>
            <h2 className="h2 mt-3">어렵지 않은 순서로 정리한 가이드</h2>
          </div>
          <Link href="/care/" className="link text-[15px]">전체 가이드</Link>
        </div>
        <ul className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {AREA_ORDER.map((a) => (
            <li key={a}>
              <Link href={`/care/${a}/`} className="card card-link block p-5">
                <p className="display text-[34px] leading-none">{AREAS[a].en}</p>
                <p className="mt-3 text-[15px] font-bold">{AREAS[a].ko}</p>
                <p className="small mt-1">{AREAS[a].desc}</p>
              </Link>
            </li>
          ))}
        </ul>
        <ul className="mt-3 grid gap-3 md:grid-cols-3">
          {latest.map((g) => <li key={g.slug}><GuideCard g={g} /></li>)}
        </ul>
      </section>

      {/* 5. 군 생활 에디토리얼 */}
      <section className="border-t border-line">
        <div className="wrap grid gap-10 py-16 md:grid-cols-[1fr_1.4fr] md:py-24">
          <div>
            <p className="eyebrow">FOR SERVICE LIFE</p>
            <h2 className="h2 mt-3">군 생활 중이라면,<br />여기부터.</h2>
            <p className="lead mt-4">제한된 시간과 환경에서도 할 수 있는 관리만 골랐어요. 부대마다 환경과 규정이 다르니, 할 수 있는 만큼만 가져가세요.</p>
          </div>
          <ul className="divide-y divide-line border-y border-line">
            {service.map((g) => (
              <li key={g.slug}>
                <Link href={`/care/${g.slug}/`} className="group flex items-center gap-4 py-5">
                  <div className="min-w-0 flex-1">
                    <p className="eyebrow !text-[11px]">{g.kicker}</p>
                    <p className="mt-1 text-[17px] font-bold tracking-tight group-hover:underline">{g.title}</p>
                  </div>
                  <span aria-hidden="true" className="text-signal">→</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 6. CREW */}
      <section className="band-ink">
        <div className="wrap py-16 md:py-24">
          <p className="eyebrow">CREW · BACK EACH OTHER. <span className="badge badge-soon ml-2">Beta 준비 중</span></p>
          <p className="mt-6 max-w-3xl text-[28px] font-extrabold leading-snug tracking-tight sm:text-[40px]">
            “내가 겪어봤으니,<br />너는 조금 덜 헤매도 된다.”
          </p>
          <p className="lead mt-5 max-w-xl">고생을 대물림하는 대신 경험을 물려주는 곳. 질문하고, 먼저 겪은 사람이 답하는 CREW를 준비하고 있어요. 신고 · 차단 · 운영 원칙이 갖춰진 뒤에 열어요.</p>
          <Link href="/crew/" className="btn btn-line mt-8">CREW가 만들려는 문화</Link>
        </div>
      </section>

      {/* 7. SELECT */}
      <section className="wrap py-16 md:py-24">
        <p className="eyebrow">SELECT <span className="badge badge-soon ml-2">Coming Soon</span></p>
        <h2 className="h2 mt-3">많이 파는 것보다, 맞게 고르는 것.</h2>
        <p className="lead mt-3 max-w-xl">상황에 맞는 제품을 고를 수 있도록 큐레이션을 준비하고 있어요. 지금은 판매하는 상품이 없어요.</p>
        <ul className="mt-8 grid gap-3 md:grid-cols-3">
          {[
            ["READY KIT", "입대 전 기초 관리를 시작하는 제품군"],
            ["DAILY ESSENTIALS", "세안 · 보습 · 자외선 · 기본 그루밍"],
            ["NEXT CHAPTER KIT", "전역 후 헤어 · 스타일 · 향"],
          ].map(([t, d]) => (
            <li key={t} className="card p-5">
              <p className="display text-[24px] leading-none">{t}</p>
              <p className="small mt-2">{d}</p>
              <p className="mt-4 text-[12px] font-semibold text-mute">준비 중</p>
            </li>
          ))}
        </ul>
        <Link href="/select/" className="link mt-6 inline-block text-[15px]">SELECT 운영 원칙 보기</Link>
      </section>

      {/* 8. About */}
      <section className="border-t border-line">
        <div className="wrap grid gap-6 py-12 md:grid-cols-3">
          <div>
            <p className="eyebrow">PROJECT STATUS</p>
            <p className="mt-2 text-[18px] font-bold">Prototype</p>
            <p className="small mt-1">공개 베타 전 단계예요. 이용자 수 · 제휴 · 성과 숫자는 아직 없어요.</p>
          </div>
          <div>
            <p className="eyebrow">MADE BY</p>
            <p className="mt-2 text-[18px] font-bold">KHUN STUDIO</p>
            <p className="small mt-1">공군 복무 경험에서 출발한 독립 프로젝트. 군 공식 서비스가 아니에요.</p>
          </div>
          <div>
            <p className="eyebrow">CONTENT PRINCIPLE</p>
            <p className="mt-2 text-[18px] font-bold">진단하지 않습니다</p>
            <p className="small mt-1">생활 관리 정보만 다루고, 검수 상태와 작성일을 글마다 표시해요. <Link href="/about/" className="link">원칙 보기</Link></p>
          </div>
        </div>
      </section>
    </>
  );
}
