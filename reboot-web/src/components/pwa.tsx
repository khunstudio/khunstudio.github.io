"use client";

import { useEffect, useState } from "react";

/** 서비스 워커 등록 (배포 환경에서만) */
export function RegisterSW() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
    navigator.serviceWorker.register(`${base}/sw.js`, { scope: `${base}/` }).catch(() => { /* 실패해도 사이트는 그대로 */ });
  }, []);
  return null;
}

type BIP = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

/** 홈 화면에 추가 안내: 안드로이드 · 크롬은 버튼, 아이폰은 공유 메뉴 안내 */
export function InstallCard() {
  const [evt, setEvt] = useState<BIP | null>(null);
  const [ios, setIos] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const standalone = matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
    setInstalled(standalone);
    setIos(/iphone|ipad|ipod/i.test(navigator.userAgent));
    const on = (e: Event) => { e.preventDefault(); setEvt(e as BIP); };
    const done = () => setInstalled(true);
    addEventListener("beforeinstallprompt", on);
    addEventListener("appinstalled", done);
    return () => { removeEventListener("beforeinstallprompt", on); removeEventListener("appinstalled", done); };
  }, []);

  if (installed || (!evt && !ios)) return null;
  return (
    <section className="mt-14">
      <div className="flex flex-wrap items-center gap-5 rounded-[16px] bg-ink p-6 text-white">
        <span className="grid gap-[5px]" aria-hidden="true"><i className="block h-4 w-4 bg-signal" /><i className="block h-4 w-4 bg-signal" /></span>
        <div className="min-w-0 flex-1">
          <p className="font-bold">RE:BOOT를 앱처럼 쓰기</p>
          <p className="mt-1 text-[14px] text-ink-mute">
            {ios ? "Safari 아래 공유 버튼 → '홈 화면에 추가'를 누르면 아이콘이 생기고 전체 화면으로 열려요." : "홈 화면에 추가하면 아이콘으로 바로 열고, 인터넷이 끊겨도 본 화면은 열려요."}
          </p>
        </div>
        {evt && (
          <button type="button" className="btn btn-primary" onClick={async () => { await evt.prompt(); const r = await evt.userChoice; if (r.outcome === "accepted") setInstalled(true); setEvt(null); }}>
            홈 화면에 추가
          </button>
        )}
      </div>
    </section>
  );
}
