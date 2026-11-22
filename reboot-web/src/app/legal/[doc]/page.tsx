import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type Doc = { title: string; sections: { h: string; p?: string[]; list?: string[] }[] };

const UPDATED = "2026-11-19";

const DOCS: Record<string, Doc> = {
  privacy: {
    title: "개인정보 처리 안내",
    sections: [
      { h: "지금 수집하는 정보", p: ["루틴 · 피부 · 목표 기능은 회원가입 없이 쓰고, 서버로 보내지 않아요. CREW(커뮤니티)에 로그인한 경우에만 아래 'CREW에서 저장하는 정보'가 서버에 저장돼요."] },
      { h: "CREW에서 저장하는 정보", list: [
        "항목: 로그인용 이메일, 닉네임, 내가 쓴 글 · 답 · '도움 됨' 표시, 신고 · 차단 기록",
        "목적: 로그인, 글 작성자 표시, 도배 방지, 신고 처리",
        "공개 범위: 다른 사람에게는 닉네임과 글만 보여요. 이메일은 공개되지 않아요.",
        "저장 위치: Supabase(데이터베이스 · 로그인 서비스)",
        "보관 · 파기: 글과 답은 직접 언제든 삭제할 수 있어요. 계정 전체 삭제는 협업 문의로 요청하면 처리해요. 신고로 가려진 글은 운영자 확인 뒤 삭제하거나 되돌려요.",
      ] },
      { h: "내 기기에만 저장되는 정보", list: [
        "30초 체크 응답(생활 모드, 관심 영역, 관리 경험, 가능한 시간, 고민, 목표), 루틴 설정, 실천 기록, 공유 카드용 닉네임(선택)",
        "저장 위치: 사용 중인 브라우저의 로컬 저장소(localStorage). 체크 진행 중 답변은 탭을 닫으면 사라지는 세션 저장소에 잠시 보관해요.",
        "MY 화면에서 언제든 JSON · CSV로 내보내거나 전부 지울 수 있어요.",
      ] },
      { h: "수집하지 않는 정보", list: ["이름, 연락처, 군번, 소속 부대, 위치, 근무 · 훈련 일정, 사진, 건강 · 진료 기록"] },
      { h: "베타 피드백", p: ["선택해서 제출한 의견은 Google Forms에 저장되며 서비스 개선에 활용합니다. 양식은 이름과 이메일을 요청하지 않습니다. 답변에는 개인이나 부대를 식별할 수 있는 정보를 적지 말아 주세요."] },
      { h: "외부 서비스", p: ["분석 도구와 광고 추적 도구를 쓰지 않아요. 글꼴은 사이트에 함께 담겨 있어요. 웹사이트는 Vercel에서 호스팅해요. 호스팅 서비스는 일반적인 접속 기록(IP 주소, 접속 시간 등)을 남길 수 있어요. 체크 응답과 루틴 기록은 브라우저의 로컬 저장소에 보관해요."] },
      { h: "앞으로 바뀔 때", p: ["서버에 정보를 저장하는 기능을 새로 열기 전에 수집 항목 · 목적 · 보관 기간 · 파기 방법을 담아 이 안내를 새로 고칠게요."] },
    ],
  },
  terms: {
    title: "이용약관",
    sections: [
      { h: "서비스의 성격", p: ["RE:BOOT는 남성 자기관리를 돕는 일반 정보와 기록 도구를 제공하는 프로토타입 서비스예요. 국방부 · 군 공식 서비스가 아니에요."] },
      { h: "의료 정보가 아님", p: ["모든 콘텐츠와 체크 결과는 일반적인 생활 관리 정보이며 의학적 진단 · 처방 · 치료를 대신하지 않아요. 증상이 계속되면 의료기관에 상담해 주세요."] },
      { h: "기록 보관", p: ["기록은 이용자의 브라우저에만 저장되어, 브라우저 데이터 삭제나 기기 변경 시 사라질 수 있어요. 운영자는 이를 복구할 수 없어요. 중요한 기록은 내보내기로 보관해 주세요."] },
      { h: "변경", p: ["프로토타입 단계라 기능과 내용이 예고 없이 바뀔 수 있어요. 중요한 변경은 이 페이지에 표시할게요."] },
    ],
  },
  community: {
    title: "커뮤니티 운영원칙",
    sections: [
      { h: "상태", p: ["CREW는 베타로 운영해요. 로그인한 사람만 글을 쓸 수 있고, 모든 글과 답에 신고 · 차단 기능이 있어요. 신고가 3건 모이면 자동으로 가려지고 운영자가 확인해요."] },
      { h: "금지", list: [
        "생활 · 외모 · 피부 상태 · 신체에 대한 비하",
        "괴롭힘, 계급을 앞세운 압박, 고생 서열화",
        "개인 신상 추적, 비공개 군 정보 · 위치 · 일정 게시",
        "진단 · 처방 대체 주장, 검증되지 않은 치료 · 약물 추천",
        "스팸, 무단 홍보, 숨겨진 협찬",
      ] },
      { h: "운영", list: [
        "처음에는 부대별 그룹 없이 군별 · 관심사별 · 생활 단계별 주제로 시작해요.",
        "운영자는 신고된 게시물을 검토하고 삭제 · 제재할 수 있으며, 처리 기록을 남겨요.",
        "제재에 대한 이의제기 절차를 함께 마련해요.",
        "경험 멘토는 의료인 · 법률 전문가가 아니며, 그렇게 소개하지 않아요.",
      ] },
    ],
  },
  advertising: {
    title: "광고 · 협찬 · 제휴 표시 정책",
    sections: [
      { h: "현재 상태", p: ["광고 · 협찬 관계는 없어요. SELECT와 성분 페이지에 성분별 예시 제품 링크가 있고, 쿠팡 파트너스 링크가 연결된 제품에는 '제휴' 표시와 안내 문구를 붙여요. 표시가 없는 링크는 일반 검색 링크라 수수료가 생기지 않아요. RE:BOOT는 상품을 직접 판매하지 않아요."] },
      { h: "앞으로의 원칙", list: [
        "협찬 · 제휴 · 광고가 있는 콘텐츠는 제목 가까이에 눈에 띄게 표시해요.",
        "제휴 링크로 수익이 생기면 그 사실을 링크 옆에 밝혀요.",
        "사용자 후기와 광고성 추천을 섞지 않아요.",
        "가격 · 재고 · 최저가 · 치료 효과를 확인 없이 단정하지 않아요.",
        "의료기관 광고는 관련 법령과 사전 심의 필요 여부를 확인한 뒤에만 다뤄요.",
        "이용자를 특정 병원에 소개하고 진료비 연동 수수료를 받는 구조는 채택하지 않아요.",
      ] },
    ],
  },
};

export function generateStaticParams() {
  return Object.keys(DOCS).map((doc) => ({ doc }));
}

export async function generateMetadata({ params }: { params: Promise<{ doc: string }> }): Promise<Metadata> {
  const { doc } = await params;
  return { title: DOCS[doc]?.title };
}

export default async function LegalPage({ params }: { params: Promise<{ doc: string }> }) {
  const { doc } = await params;
  const d = DOCS[doc];
  if (!d) notFound();
  return (
    <div className="wrap-narrow py-14 md:py-20">
      <p className="eyebrow">LEGAL</p>
      <h1 className="h1 mt-3">{d.title}</h1>
      <p className="mt-4 flex flex-wrap items-center gap-2 text-[13px] text-mute">
        <span className="badge badge-draft">초안 · 법률 검토 전</span>
        <span>작성 {UPDATED}</span>
      </p>
      <div className="prose-r mt-6">
        {d.sections.map((s) => (
          <section key={s.h}>
            <h2>{s.h}</h2>
            {s.p?.map((t) => <p key={t}>{t}</p>)}
            {s.list && <ul>{s.list.map((t) => <li key={t}>{t}</li>)}</ul>}
          </section>
        ))}
      </div>
      <p className="small mt-10">다른 안내: {Object.entries(DOCS).filter(([k]) => k !== doc).map(([k, v], i) => (
        <span key={k}>{i > 0 && " · "}<Link href={`/legal/${k}/`} className="link">{v.title}</Link></span>
      ))}</p>
    </div>
  );
}
