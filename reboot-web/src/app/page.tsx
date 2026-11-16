import Link from "next/link";
import { GUIDES } from "@/content/guides";
import { GuideCard } from "@/components/guide-browser";
import { HeroPreview, TodayStrip } from "@/components/home-today";
import { Photo } from "@/components/photo";
import { MODES, MODE_ORDER } from "@/lib/labels";

const FLOW = [
  { en: "CHECK", ko: "30초 체크", d: "생활 단계, 관심 영역, 쓸 수 있는 시간을 6개 질문으로 정리해요." },
  { en: "ROUTINE", ko: "나에게 맞는 루틴", d: "아침 · 저녁 루틴을 만들고, 오늘 상황에 맞게 바꾸고, 필요 없는 항목은 빼요." },
  { en: "RECORD", ko: "매일 기록", d: "체크한 날이 7일 · 30일 기록으로 쌓여요. 생활 단계가 바뀌어도 이어져요." },
];

const AREAS_PHOTO = [
  { a: "skin", en: "SKIN", ko: "피부", d: "세안 · 보습 · 자외선 · 면도", photo: "hands" as const, alt: "손끝으로 볼에 보습제를 바르는 남자" },
  { a: "body", en: "BODY", ko: "운동", d: "스트레칭 · 땀 관리", photo: "track" as const, alt: "해 뜨는 운동장에서 스트레칭하는 짧은 머리의 남자" },
  { a: "style", en: "STYLE", ko: "헤어 · 스타일", d: "헤어 · 옷 · 외출 준비", photo: "mirror" as const, alt: "외출 전 거울을 보며 머리를 정리하는 남자" },
];

export default function Home() {
  const latest = ["skin-basics", "shaving", "next-chapter"].map((s) => GUIDES.find((g) => g.slug === s)!);
  const service = ["px", "outdoor-day", "leave-prep", "before-enlistment"].map((s) => GUIDES.find((g) => g.slug === s)!);

  return (
    <>
      <TodayStrip />

      {/* 1. Hero: 새벽 세면대 */}
      <section className="band-ink">
        <div className="hero-grid grid md:grid-cols-[1fr_1.35fr]">
          <div className="relative order-1 aspect-[4/3] md:order-2 md:aspect-auto">
            <div className="absolute inset-0">
              <Photo name="wash" alt="이른 아침 세면대에서 찬물로 세수하는 남자" sizes="large" priority position="62% 50%" className="h-full" />
            </div>
          </div>
          <div className="order-2 flex flex-col justify-center px-5 py-12 md:order-1 md:px-[max(20px,calc((100vw-1160px)/2+20px))] md:py-16 md:pr-12">
            <p className="eyebrow">06:00 · MEN&apos;S SELF-CARE</p>
            <p className="display mt-5 text-[60px] sm:text-[76px] lg:text-[92px]" aria-hidden="true">
              RE<span className="colon">:</span>BOOT<br />YOURSELF.
            </p>
            <h1 className="mt-6 text-[24px] font-extrabold leading-snug tracking-tight sm:text-[30px]">보이고 싶은 모습부터, 다시 켜다.</h1>
            <p className="lead mt-4 max-w-[32rem]">
              입대 전부터 복무 중, 전역 후, 그리고 그다음 일상까지. 30초 체크로 오늘 할 수 있는 순서를 받고, 매일 기록하세요.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/start/" className="btn btn-primary">30초 체크 시작</Link>
              <Link href="/care/" className="btn btn-line">가이드 먼저 보기</Link>
            </div>
            <p className="mt-4 text-[13px] text-ink-mute">로그인 없이 · 기록은 내 브라우저에만 저장</p>
          </div>
        </div>
      </section>

      {/* 2. 핵심 문장 + 패치노트 */}
      <section className="wrap grid items-center gap-12 py-16 md:grid-cols-[1.2fr_1fr] md:py-24">
        <div>
          <p className="eyebrow">SELF UPDATE</p>
          <h2 className="mt-4 text-[34px] font-black leading-[1.18] tracking-[-0.035em] sm:text-[48px]">
            얼굴은 못 바꿔도,<br /><span className="text-signal-ink">버전</span>은 올릴 수 있다.
          </h2>
          <p className="lead mt-5 max-w-xl">잘생겨지라고 하지 않아요. 오늘 무엇부터 할지 알려주고, 그걸 했는지 같이 기록해요. 맞으면 더하고, 안 맞으면 지워요. 그게 업데이트예요.</p>
          <Link href="/my/" className="link mt-6 inline-block text-[15px]">내 기록을 패치노트 카드로 만들기</Link>
        </div>
        <div className="band-ink mx-auto w-full max-w-[340px] rounded-[16px] p-6 shadow-[0_30px_60px_rgba(0,0,0,.18)]">
          <div className="flex items-center justify-between">
            <span className="display text-[22px]" style={{ textTransform: "none" }}>RE<span className="colon">:</span>BOOT</span>
            <span className="patch text-[11px] text-ink-mute">예시</span>
          </div>
          <p className="display mt-8 text-[54px]" style={{ textTransform: "none" }}>v1.0 →<br /><span className="colon">v2.0</span></p>
          <p className="patch mt-3 text-[11px] text-ink-mute">PATCH NOTES · 30 DAYS</p>
          <ul className="patch mt-5 grid gap-2 text-[13px]">
            <li><span className="colon mr-2">+</span>매일 아침 자외선 차단제</li>
            <li><span className="colon mr-2">+</span>면도 전 수염 불리기</li>
            <li><span className="mr-2 text-ink-mute">−</span>아무 비누로 세안</li>
            <li><span className="colon mr-2">✓</span>면도 후 따가움 수정</li>
          </ul>
          <div className="mt-6 h-1 rounded bg-signal" />
          <p className="display mt-3 text-[16px]">UPDATE COMPLETE.</p>
        </div>
      </section>

      {/* 3. 모드 */}
      <section className="band-sand">
        <div className="wrap py-16 md:py-24">
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
                  <span className="mt-6 text-[14px] font-bold">이 단계로 시작 →</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 4. 이용 흐름 */}
      <section className="wrap grid items-center gap-12 py-16 md:grid-cols-[1.1fr_1fr] md:py-24">
        <div>
          <p className="eyebrow">HOW IT WORKS</p>
          <h2 className="h2 mt-3">체크하고, 루틴을 만들고, 기록하세요.</h2>
          <ol className="mt-8 grid gap-6">
            {FLOW.map((f, i) => (
              <li key={f.en} className="grid grid-cols-[auto_1fr] gap-5 border-t-2 border-ink pt-4">
                <p className="display text-[34px] leading-none">{f.en}<span className="colon">{i < 2 ? ":" : "."}</span></p>
                <div>
                  <p className="font-bold">{f.ko}</p>
                  <p className="small mt-1 !text-[14.5px]">{f.d}</p>
                </div>
              </li>
            ))}
          </ol>
          <Link href="/start/" className="btn btn-dark mt-8">30초 체크 시작</Link>
        </div>
        <div className="band-ink rounded-[20px] px-6 py-10"><HeroPreview /></div>
      </section>

      {/* 5. CARE 영역: 사진 */}
      <section className="band-ink">
        <div className="wrap py-16 md:py-24">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">CARE</p>
              <h2 className="h2 mt-3">어렵지 않은 순서로 정리한 가이드</h2>
            </div>
            <Link href="/care/" className="link text-[15px]">전체 가이드</Link>
          </div>
          <ul className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {AREAS_PHOTO.map((x) => (
              <li key={x.a}>
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
            <li>
              <Link href="/care/life/" className="area-tile">
                <div className="flex aspect-[4/5] flex-col justify-between rounded-[12px] border border-ink-line p-4">
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
        </div>
      </section>

      <section className="wrap py-16 md:py-20">
        <p className="eyebrow">LATEST</p>
        <h2 className="h2 mt-3">먼저 읽어 볼 가이드</h2>
        <ul className="mt-8 grid gap-4 md:grid-cols-3">
          {latest.map((g) => <li key={g.slug}><GuideCard g={g} /></li>)}
        </ul>
      </section>

      {/* 6. 군 생활 */}
      <section className="border-t border-line">
        <div className="wrap grid items-stretch gap-10 py-16 md:grid-cols-[1fr_1.1fr] md:py-24">
          <Photo name="razor" alt="김 서린 거울 앞 스테인리스 선반 위의 면도기와 수건" ratio="1 / 1" className="rounded-[16px]" />
          <div className="flex flex-col justify-center">
            <p className="eyebrow">FOR SERVICE LIFE</p>
            <h2 className="h2 mt-3">군 생활 중이라면,<br />여기부터.</h2>
            <p className="lead mt-4">제한된 시간과 환경에서도 할 수 있는 관리만 골랐어요. 부대마다 환경과 규정이 다르니, 할 수 있는 만큼만 가져가세요.</p>
            <ul className="mt-6 divide-y divide-line border-y border-line">
              {service.map((g) => (
                <li key={g.slug}>
                  <Link href={`/care/${g.slug}/`} className="group flex items-center gap-4 py-4">
                    <div className="min-w-0 flex-1">
                      <p className="eyebrow !text-[11px]">{g.kicker}</p>
                      <p className="mt-1 text-[16.5px] font-bold tracking-tight group-hover:underline">{g.title}</p>
                    </div>
                    <span aria-hidden="true">→</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 7. CREW */}
      <section className="band-ink">
        <div className="wrap py-16 md:py-24">
          <p className="eyebrow">CREW · BACK EACH OTHER. <span className="badge badge-soon ml-2">Beta 준비 중</span></p>
          <p className="mt-6 max-w-3xl text-[28px] font-extrabold leading-snug tracking-tight sm:text-[42px]">
            &ldquo;내가 겪어봤으니,<br />너는 조금 덜 헤매도 된다.&rdquo;
          </p>
          <p className="lead mt-5 max-w-xl">고생을 대물림하는 대신 경험을 물려주는 곳. 질문하고, 먼저 겪은 사람이 답하는 CREW를 준비하고 있어요. 신고 · 차단 · 운영 원칙이 갖춰진 뒤에 열어요.</p>
          <Link href="/crew/" className="btn btn-line mt-8">CREW가 만들려는 문화</Link>
        </div>
      </section>

      {/* 8. SELECT · 콘셉트 */}
      <section className="wrap grid items-center gap-10 py-16 md:grid-cols-[1fr_1fr] md:py-24">
        <div className="order-2 md:order-1">
          <p className="eyebrow">SELECT <span className="badge badge-soon ml-2">Coming Soon</span></p>
          <h2 className="h2 mt-3">많이 파는 것보다,<br />맞게 고르는 것.</h2>
          <p className="lead mt-4 max-w-md">루틴의 순서가 곧 제품의 순서가 되는 큐레이션을 준비하고 있어요. 01 세안, 02 보습, 03 자외선 차단.</p>
          <div className="notice mt-6"><p>사진의 제품은 디자인 콘셉트예요. 지금은 판매하거나 연결하는 상품이 없어요.</p></div>
          <Link href="/select/" className="link mt-6 inline-block text-[15px]">SELECT 운영 원칙 보기</Link>
        </div>
        <Photo name="kit" alt="세면대 위에 01, 02, 03 번호가 적힌 검정 용기 세 개 (콘셉트 디자인)" ratio="4 / 5" className="order-1 rounded-[16px] md:order-2" />
      </section>

      {/* 9. About */}
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
