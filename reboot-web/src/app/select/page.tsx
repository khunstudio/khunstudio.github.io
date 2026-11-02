import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "SELECT" };

const KITS = [
  ["READY KIT", "입대 전", "기초 관리를 처음 시작할 때 필요한 제품군"],
  ["DAILY ESSENTIALS", "모든 단계", "세안 · 보습 · 자외선 · 기본 그루밍"],
  ["NEXT CHAPTER KIT", "전역 후", "헤어 · 스타일 · 향처럼 일상으로 넓히는 제품군"],
];

const PRINCIPLES = [
  ["판매처를 숨기지 않아요", "처음에는 공식 판매처 링크로 연결하고, 공급사 · 가격 · 배송비 · 확인 날짜를 함께 적을 예정이에요."],
  ["광고와 후기를 나눠요", "협찬 · 제휴가 있으면 눈에 띄게 표시하고, 사용자 후기와 광고성 추천을 섞지 않아요."],
  ["확인되지 않은 건 말하지 않아요", "최저가, 재고, PX 입점을 단정하지 않아요. PX의 가격과 거래 조건은 일반 온라인몰과 다를 수 있어요."],
];

export default function SelectPage() {
  return (
    <div className="wrap py-14 md:py-20">
      <p className="eyebrow">SELECT <span className="badge badge-soon ml-2">Coming Soon</span></p>
      <h1 className="h1 mt-3">많이 파는 것보다,<br />맞게 고르는 것.</h1>
      <p className="lead mt-4 max-w-xl">사용자의 상황에 맞는 제품을 고를 수 있도록 큐레이션을 준비하고 있어요.</p>

      <div className="notice mt-8">
        <p><b>지금은 판매하거나 연결하는 상품이 없어요.</b> 장바구니 · 결제 · 가격 정보도 없어요. 제휴와 운영 체계가 준비되면 이 페이지에서 시작할게요.</p>
      </div>

      <h2 className="sec-head h3 mt-12">준비 중인 큐레이션</h2>
      <ul className="grid gap-3 md:grid-cols-3">
        {KITS.map(([t, m, d]) => (
          <li key={t} className="card p-6">
            <p className="small !text-[12px] font-semibold">{m}</p>
            <p className="display mt-2 text-[28px] leading-none">{t}</p>
            <p className="small mt-3">{d}</p>
          </li>
        ))}
      </ul>

      <h2 className="sec-head h3 mt-14">운영 원칙</h2>
      <ul className="grid gap-6 md:grid-cols-3">
        {PRINCIPLES.map(([t, d]) => (
          <li key={t} className="border-t-2 border-ink pt-4">
            <p className="font-bold">{t}</p>
            <p className="small mt-2">{d}</p>
          </li>
        ))}
      </ul>
      <p className="small mt-8">관련 정책: <Link href="/legal/advertising/" className="link">광고 · 협찬 · 제휴 표시 정책(초안)</Link></p>
    </div>
  );
}
