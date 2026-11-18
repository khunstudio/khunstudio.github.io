import Link from "next/link";
import { GUIDES } from "@/content/guides";
import { GuideCard } from "@/components/guide-browser";
import { TodayStrip } from "@/components/home-today";
import { HeroFog } from "@/components/hero-fog";
import { RevealObserver } from "@/components/home/reveal";
import { StoryScroll } from "@/components/home/story-scroll";
import { DPlusCount } from "@/components/home/dplus-count";
import { Photo } from "@/components/photo";
import { MODES, MODE_ORDER } from "@/lib/labels";

const AREAS_PHOTO = [
  { a: "skin", en: "SKIN", ko: "피부", d: "세안 · 보습 · 자외선 · 면도", photo: "hands" as const, alt: "손끝으로 볼에 보습제를 바르는 남자" },
  { a: "body", en: "BODY", ko: "운동", d: "스트레칭 · 땀 관리", photo: "track" as const, alt: "해 뜨는 운동장에서 스트레칭하는 짧은 머리의 남자" },
  { a: "style", en: "STYLE", ko: "헤어 · 스타일", d: "헤어 · 옷 · 외출 준비", photo: "mirror" as const, alt: "외출 전 거울을 보며 머리를 정리하는 남자" },
];

export default function Home() {
  const service = ["px", "outdoor-day", "leave-prep", "before-enlistment"].map((s) => GUIDES.find((g) => g.slug === s)!);
  const latest = ["skin-basics", "shaving", "next-chapter"].map((s) => GUIDES.find((g) => g.slug === s)!);

  return (
    <>
      <RevealObserver />
      <TodayStrip />

      {/* 1. HERO: 한 문장 + 김 서린 거울 */}
      <section className="t-hero">
        <div className="wrap text-center">
          <p className="t-k" data-rv>06:00 · MEN&apos;S SELF-CARE</p>
          <h1 className="t-xxl mt-5" data-rv style={{ ["--d" as string]: "80ms" }}>
            남자 관리, 뭐부터 할지<br />30초면 알려드려요<span className="colon hero-colon">.</span>
          </h1>
          <p className="t-sub mx-auto mt-6 max-w-[36rem]" data-rv style={{ ["--d" as string]: "160ms" }}>
            입대 전 · 복무 중 · 전역 후, 지금 나에게 맞는<br className="hidden sm:block" /> 세안 · 보습 · 자외선 차단 순서를 받고 매일 체크하세요.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3" data-rv style={{ ["--d" as string]: "240ms" }}>
            <Link href="/start/" className="btn btn-primary">30초 체크 시작</Link>
            <Link href="/care/" className="btn btn-soft">가이드 먼저 보기</Link>
          </div>
        </div>
        <div className="wrap mt-14 md:mt-20" data-rv style={{ ["--d" as string]: "320ms" }}>
          <div className="t-hero-photo">
            <div className="absolute inset-0">
              <Photo name="wash" alt="이른 아침 세면대에서 찬물로 세수하는 남자" sizes="large" priority position="62% 50%" className="h-full" />
            </div>
            <HeroFog />
          </div>
        </div>
      </section>

      {/* 2. 한 문장 */}
      <section className="t-sec">
        <div className="wrap text-center">
          <p className="t-xl" data-rv>
            잘생겨지라는 게 아니에요.<br />
            <span className="text-mute">오늘 뭘 할지 알려주고,</span><br />
            <span className="text-mute">했는지 같이 기록할게요.</span>
          </p>
        </div>
      </section>

      {/* 3. 고정 스크롤: 체크 → 루틴 → 기록 */}
      <StoryScroll />

      {/* 4. D+ */}
      <section className="t-sec band-ink">
        <div className="wrap text-center">
          <p className="t-k" data-rv>SELF UPDATE</p>
          <h2 className="t-xl mt-4" data-rv>남은 날 말고,<br />쌓인 날을 세요.</h2>
          <div className="mt-14" data-rv><DPlusCount /></div>
          <p className="t-sub mx-auto mt-10 max-w-md" data-rv>전역일을 세던 시간은 끝났어요. 시작한 날이 D+1, 체크한 날마다 하루씩 쌓여요.</p>
        </div>
      </section>

      {/* 5. 생활 단계 */}
      <section className="t-sec band-mist">
        <div className="wrap">
          <p className="t-k" data-rv>START WHERE YOU ARE</p>
          <h2 className="t-xl mt-4" data-rv>어느 시기든,<br />같은 RE:BOOT로 이어져요.</h2>
          <ul className="t-cards mt-12">
            {MODE_ORDER.map((m, i) => (
              <li key={m} data-rv style={{ ["--d" as string]: `${i * 90}ms` }}>
                <Link href={`/check/?mode=${m}`} className="t-card">
                  <span className="t-card-n">0{i + 1}</span>
                  <span className="t-card-t">{MODES[m].ko}</span>
                  <span className="t-card-d">{MODES[m].desc}</span>
                  <span className="t-card-go" aria-hidden="true">→</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 6. CARE */}
      <section className="t-sec">
        <div className="wrap">
          <p className="t-k" data-rv>CARE</p>
          <h2 className="t-xl mt-4" data-rv>어렵지 않은 순서로<br />정리했어요.</h2>
          <ul className="mt-12 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {AREAS_PHOTO.map((x, i) => (
              <li key={x.a} data-rv style={{ ["--d" as string]: `${i * 90}ms` }}>
                <Link href={`/care/${x.a}/`} className="area-tile">
                  <Photo name={x.photo} alt={x.alt} />
                  <div className="cap">
                    <p className="display">{x.en}</p>
                    <p className="mt-1 text-[14px] font-bold">{x.ko}</p>
                    <p className="text-[12.5px] text-white/70">{x.d}</p>
                  </div>
                </Link>
              </li>
            ))}
            <li data-rv style={{ ["--d" as string]: "270ms" }}>
              <Link href="/care/life/" className="area-tile">
                <div className="flex aspect-[4/5] flex-col justify-between rounded-[12px] bg-ink p-4 text-white">
                  <p className="display mt-6 text-center text-[52px] sm:text-[72px]">06<span className="colon">:</span>00</p>
                  <div>
                    <p className="display text-[34px]">LIFE</p>
                    <p className="mt-1 text-[14px] font-bold">생활습관</p>
                    <p className="text-[12.5px] text-white/70">수면 · 수분 · 하루 정리</p>
                  </div>
                </div>
              </Link>
            </li>
          </ul>
          <ul className="mt-6 grid gap-4 md:grid-cols-3">
            {latest.map((g, i) => <li key={g.slug} data-rv style={{ ["--d" as string]: `${i * 90}ms` }}><GuideCard g={g} /></li>)}
          </ul>
        </div>
      </section>

      {/* 7. 군 생활 */}
      <section className="t-sec band-mist">
        <div className="wrap grid items-center gap-10 md:grid-cols-[1fr_1.1fr] md:gap-16">
          <div data-rv><Photo name="razor" alt="김 서린 거울 앞 스테인리스 선반 위의 면도기와 수건" ratio="1 / 1" className="rounded-[24px]" /></div>
          <div>
            <p className="t-k" data-rv>FOR SERVICE LIFE</p>
            <h2 className="t-xl mt-4" data-rv>군 생활 중이라면,<br />여기부터.</h2>
            <p className="t-sub mt-5" data-rv>제한된 시간과 환경에서도 할 수 있는 관리만 골랐어요. 부대마다 규정이 다르니, 할 수 있는 만큼만 가져가세요.</p>
            <ul className="t-list mt-8" data-rv>
              {service.map((g) => (
                <li key={g.slug}>
                  <Link href={`/care/${g.slug}/`}>
                    <span>{g.title}</span>
                    <span aria-hidden="true">→</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 8. CREW · SELECT: 준비 중 두 장 */}
      <section className="t-sec">
        <div className="wrap grid gap-4 md:grid-cols-2">
          <Link href="/crew/" className="t-panel band-ink" data-rv>
            <span className="badge badge-soon">Beta 준비 중</span>
            <p className="t-lg mt-6">&ldquo;내가 겪어봤으니,<br />너는 조금 덜 헤매도 된다.&rdquo;</p>
            <p className="t-sub mt-4 !text-ink-mute">경험을 물려주는 CREW. 신고 · 차단 · 운영 원칙이 갖춰진 뒤에 열어요.</p>
            <span className="t-panel-go">CREW가 만들려는 문화 →</span>
          </Link>
          <Link href="/select/" className="t-panel t-panel-photo" data-rv style={{ ["--d" as string]: "90ms" }}>
            <div className="absolute inset-0"><Photo name="kit" alt="세면대 위에 01, 02, 03 번호가 적힌 검정 용기 세 개 (콘셉트 디자인)" className="h-full" /></div>
            <div className="relative">
              <span className="badge badge-soon">Coming Soon</span>
              <p className="t-lg mt-6">많이 파는 것보다,<br />맞게 고르는 것.</p>
              <p className="mt-4 text-[14px] text-white/80">사진의 제품은 디자인 콘셉트예요. 지금 판매하는 상품은 없어요.</p>
            </div>
          </Link>
        </div>
      </section>

      {/* 9. 마지막 CTA */}
      <section className="t-sec band-ink">
        <div className="wrap text-center">
          <p className="t-xxl" data-rv>오늘<span className="colon">,</span><br />다시 켜볼까요?</p>
          <div className="mt-10" data-rv style={{ ["--d" as string]: "120ms" }}>
            <Link href="/start/" className="btn btn-primary btn-lg">30초 체크 시작</Link>
          </div>
          <p className="mt-5 text-[13px] text-ink-mute" data-rv style={{ ["--d" as string]: "200ms" }}>로그인 없이 · 기록은 내 브라우저에만 저장</p>
        </div>
      </section>

      {/* 10. 프로젝트 상태 (정직하게) */}
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
