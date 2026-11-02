"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`display not-italic ${className}`} style={{ textTransform: "none", letterSpacing: "0.01em" }}>
      RE<span className="colon">:</span>BOOT
    </span>
  );
}

export function Check({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3.5 8.5 6.5 11.5 12.5 4.5" />
    </svg>
  );
}

const isActive = (path: string, href: string) => (href === "/" ? path === "/" : path === href || path.startsWith(href + "/") || path.startsWith(href));

const TOP = [
  { href: "/care/", label: "CARE" },
  { href: "/routine/", label: "ROUTINE" },
  { href: "/crew/", label: "CREW", badge: "Beta 준비" },
  { href: "/select/", label: "SELECT", badge: "Coming Soon" },
  { href: "/my/", label: "MY" },
];

export function Header() {
  const path = usePathname() || "/";
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/95 backdrop-blur" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <div className="wrap flex h-14 items-center gap-6">
        <Link href="/" aria-label="RE:BOOT 홈" className="text-[24px] leading-none">
          <Wordmark />
        </Link>
        <nav aria-label="주 메뉴" className="ml-auto hidden items-center gap-6 md:flex">
          {TOP.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              aria-current={isActive(path, m.href) ? "page" : undefined}
              className="eyebrow flex items-center gap-1.5 !text-[12.5px] !text-ink/60 hover:!text-ink aria-[current=page]:!text-ink"
            >
              {m.label}
              {m.badge && <span className="badge badge-soon !h-[18px] !px-1.5 !text-[9.5px] !tracking-normal normal-case">{m.badge}</span>}
            </Link>
          ))}
        </nav>
        <Link href="/start/" className="btn btn-dark ml-auto !min-h-9 !px-4 !text-[13.5px] md:ml-0">
          시작하기
        </Link>
      </div>
    </header>
  );
}

const ICON = {
  today: <path d="M4 10.5 12 4l8 6.5V20h-5.5v-5.5h-5V20H4z" />,
  care: (<><path d="M5 4.5h10l4 4V20H5z" /><path d="M9 12.5h6M9 16h4" /></>),
  routine: (<><circle cx="12" cy="12" r="8" /><path d="m8.5 12 2.5 2.5 4.5-5" /></>),
  my: (<><circle cx="12" cy="8.5" r="3.5" /><path d="M5 20c1.2-3.8 3.9-5.6 7-5.6s5.8 1.8 7 5.6" /></>),
};

export function BottomNav() {
  const path = usePathname() || "/";
  const items = [
    { href: "/", label: "TODAY", icon: ICON.today },
    { href: "/care/", label: "CARE", icon: ICON.care },
    { href: "/routine/", label: "ROUTINE", icon: ICON.routine },
    { href: "/my/", label: "MY", icon: ICON.my },
  ];
  return (
    <nav className="bnav" aria-label="하단 메뉴">
      <ul>
        {items.map((i) => (
          <li key={i.href}>
            <Link href={i.href} aria-current={isActive(path, i.href) ? "page" : undefined}>
              <svg viewBox="0 0 24 24" aria-hidden="true">{i.icon}</svg>
              {i.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function Footer() {
  return (
    <footer className="band-ink mt-0">
      <div className="wrap grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="text-[30px] leading-none"><Wordmark /></p>
          <p className="mt-4 text-[15px] text-ink-mute">RE:BOOT YOURSELF. BACK EACH OTHER.</p>
          <p className="mt-6 max-w-sm text-[13px] leading-relaxed text-ink-mute">
            KHUN STUDIO가 기획·운영하는 독립 프로젝트입니다. 국방부·군 공식 서비스가 아니며 어떤 기관과도 제휴 관계가 없습니다. 현재 프로토타입 단계입니다.
          </p>
        </div>
        <ul className="grid content-start gap-2.5 text-[14px] text-ink-mute">
          <li><Link className="hover:text-white" href="/care/">CARE 가이드</Link></li>
          <li><Link className="hover:text-white" href="/check/">30초 체크</Link></li>
          <li><Link className="hover:text-white" href="/crew/">CREW <span className="badge badge-soon ml-1">Beta 준비</span></Link></li>
          <li><Link className="hover:text-white" href="/select/">SELECT <span className="badge badge-soon ml-1">Coming Soon</span></Link></li>
          <li><Link className="hover:text-white" href="/about/">소개 · 운영 원칙</Link></li>
          <li><Link className="hover:text-white" href="/partnership/">협업 문의</Link></li>
        </ul>
        <ul className="grid content-start gap-2.5 text-[14px] text-ink-mute">
          <li><Link className="hover:text-white" href="/legal/privacy/">개인정보 처리 안내</Link></li>
          <li><Link className="hover:text-white" href="/legal/terms/">이용약관</Link></li>
          <li><Link className="hover:text-white" href="/legal/community/">커뮤니티 운영원칙</Link></li>
          <li><Link className="hover:text-white" href="/legal/advertising/">광고 · 제휴 표시 정책</Link></li>
        </ul>
      </div>
      <div className="wrap border-t border-ink-line py-5 text-[12px] text-ink-mute">
        이 사이트의 정보는 일반적인 생활 관리 정보이며 의학적 진단이나 치료를 대신하지 않습니다.
      </div>
    </footer>
  );
}
