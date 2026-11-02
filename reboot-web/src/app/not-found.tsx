import Link from "next/link";

export default function NotFound() {
  return (
    <div className="wrap-narrow py-20">
      <p className="display text-[96px] leading-none">4<span className="colon">0</span>4</p>
      <h1 className="h2 mt-6">찾는 페이지가 없어요</h1>
      <p className="lead mt-3">주소가 바뀌었거나 아직 준비 중인 페이지예요.</p>
      <div className="mt-8 flex gap-2">
        <Link href="/" className="btn btn-dark">홈으로</Link>
        <Link href="/care/" className="btn btn-ghost">가이드 보기</Link>
      </div>
    </div>
  );
}
