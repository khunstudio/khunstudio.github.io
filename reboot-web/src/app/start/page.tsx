import Link from "next/link";
import type { Metadata } from "next";
import { MODES, MODE_ORDER } from "@/lib/labels";

export const metadata: Metadata = { title: "시작하기" };

export default function StartPage() {
  return (
    <div className="wrap-narrow py-10 md:py-16">
      <p className="eyebrow">START · 1/2</p>
      <h1 className="h1 mt-3">지금의 나에게 맞춰<br />시작해 볼까요?</h1>
      <p className="lead mt-4">생활 단계에 따라 추천이 조금씩 달라져요. 언제든 MY에서 바꿀 수 있고, 바꿔도 기록은 그대로 남아요.</p>

      <ul className="mt-8 grid gap-3">
        {MODE_ORDER.map((m) => (
          <li key={m}>
            <Link href={`/check/?mode=${m}`} className="card card-link flex items-center gap-4 p-5">
              <div className="min-w-0 flex-1">
                <p className="eyebrow !text-[11px]">{MODES[m].en}</p>
                <p className="mt-1 text-[19px] font-bold tracking-tight">{MODES[m].ko}</p>
                <p className="small mt-1">{MODES[m].desc}</p>
              </div>
              <span aria-hidden="true" className="text-[22px] text-signal">→</span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="notice mt-8">
        <p>로그인 없이 바로 쓸 수 있어요. 체크 결과와 기록은 서버로 보내지 않고 <b>이 브라우저에만</b> 저장돼요. 군 인증이나 소속 정보는 묻지 않아요.</p>
      </div>
    </div>
  );
}
