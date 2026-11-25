import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "오프라인", robots: { index: false } };

export default function OfflinePage() {
  return (
    <div className="wrap-narrow py-16">
      <p className="eyebrow">OFFLINE</p>
      <h1 className="h1 mt-3">인터넷 연결이 끊겼어요</h1>
      <p className="lead mt-3">연결되면 다시 열려요. 오늘 루틴과 기록은 이 기기에 저장돼 있어서, 한 번 열어 본 화면은 그대로 쓸 수 있어요.</p>
      <div className="mt-6 flex flex-wrap gap-2">
        <Link href="/routine/" className="btn btn-dark">오늘 루틴</Link>
        <Link href="/" className="btn btn-ghost">홈</Link>
      </div>
    </div>
  );
}
