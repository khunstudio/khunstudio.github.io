import Link from "next/link";
import type { Metadata } from "next";
import { InquiryForm } from "./inquiry-form";

export const metadata: Metadata = { title: "협업 문의" };

export default function PartnershipPage() {
  return (
    <div className="wrap-narrow py-14 md:py-20">
      <p className="eyebrow">PARTNERSHIP</p>
      <h1 className="h1 mt-3">브랜드 · 의료진 · 콘텐츠 협업</h1>
      <p className="lead mt-4">RE:BOOT의 콘텐츠 원칙에 맞는 협업을 기다려요. 현재 진행 중인 제휴는 없어요.</p>

      <div className="prose-r mt-8">
        <h2>함께하고 싶은 일</h2>
        <ul>
          <li>의료 전문가의 가이드 검수 (검수자 · 검수일을 글에 표시)</li>
          <li>남성 그루밍 브랜드와의 정보성 콘텐츠 협업 (협찬 표시 필수)</li>
          <li>사용자 인터뷰 · 사용성 테스트 참여</li>
        </ul>
        <h2>하지 않는 일</h2>
        <ul>
          <li>이용자를 특정 병원에 소개하고 진료비에 연동된 수수료를 받는 구조</li>
          <li>협찬 사실을 숨긴 추천이나 조작된 후기</li>
          <li>치료 효과를 보장하거나 과장하는 광고</li>
        </ul>
        <h2>문의</h2>
        <p>아래 양식으로 보내 주시면 운영자가 직접 확인하고 이메일로 답장드려요.</p>
      </div>
      <InquiryForm />
      <p className="small mt-6">운영 주체: <a href="https://khunstudio.github.io/" className="link" target="_blank" rel="noopener noreferrer">KHUN STUDIO</a></p>
      <p className="small mt-8">관련 정책: <Link href="/legal/advertising/" className="link">광고 · 협찬 · 제휴 표시 정책(초안)</Link></p>
    </div>
  );
}
