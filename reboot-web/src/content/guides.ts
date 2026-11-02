import type { Area, Mode } from "../lib/types.ts";

// CARE 가이드. 모두 일반적인 생활 관리 정보이며, 의료 전문가 검수 전 상태로 표시한다.
// 검수가 끝나면 review를 "reviewed"로 바꾸고 reviewer · reviewedAt을 채운다.

export interface GuideSection {
  h: string;
  p?: string[];
  list?: string[];
  steps?: string[];
}

export interface Guide {
  slug: string;
  area: Area;
  modes: Mode[];
  kicker: string;
  title: string;
  summary: string;
  read: number;
  updated: string;
  review: "draft" | "reviewed";
  reviewer?: string;
  /** 진료 · 건강 관련 내용이라 상단에 안내를 크게 띄운다 */
  medicalNotice?: boolean;
  sections: GuideSection[];
  checklist?: { title: string; items: string[] };
}

const ALL: Mode[] = ["prepare", "service", "next", "everyday"];
const UPDATED = "2026-11-02";

export const GUIDES: Guide[] = [
  {
    slug: "skin-basics", area: "skin", modes: ALL, kicker: "START HERE",
    title: "처음 시작하는 기초 관리 3단계",
    summary: "세안, 보습, 자외선 차단. 제품을 많이 사기 전에 이 세 가지부터 매일 하는 게 먼저예요.",
    read: 3, updated: UPDATED, review: "draft",
    sections: [
      { h: "왜 세 가지부터인가요", p: ["관리를 처음 시작할 때 가장 흔한 실수는 한 번에 여러 제품을 사서 동시에 쓰는 거예요. 무엇이 맞고 안 맞는지 알 수 없게 됩니다.", "세안 · 보습 · 자외선 차단은 피부 타입과 상관없이 기본이 되는 단계라, 여기서 시작해 2주 정도 익숙해진 다음 하나씩 더하는 편이 좋아요."] },
      { h: "아침", steps: ["미지근한 물로 세안. 피부가 많이 번들거리면 순한 세안제를 소량만 써요.", "물기가 조금 남았을 때 보습제를 얇게.", "자외선 차단제를 손가락 두 마디 정도 양으로 얼굴과 목에."] },
      { h: "저녁", steps: ["세안제로 1분 정도 꼼꼼히 세안. 자외선 차단제는 물만으로 잘 지워지지 않아요.", "세안 후 1분 안에 보습제."] },
      { h: "제품을 고를 때", list: ["향이 강하지 않은 제품부터 시작해요.", "새 제품은 한 번에 하나씩 바꾸고, 2주 정도 써 본 뒤 판단해요.", "따갑거나 붉어지는 느낌이 계속되면 사용을 멈추고, 이어지면 의료기관에 상담해요."] },
    ],
    checklist: { title: "오늘부터 체크", items: ["세안제 1개", "보습제 1개", "자외선 차단제 1개", "아침 · 저녁 시간 정하기"] },
  },
  {
    slug: "shaving", area: "skin", modes: ALL, kicker: "SKIN",
    title: "면도 후 자극을 줄이기 위해 확인할 것",
    summary: "따가움은 면도 방법에서 시작되는 경우가 많아요. 순서와 도구를 먼저 점검해 봐요.",
    read: 3, updated: UPDATED, review: "draft",
    sections: [
      { h: "면도 전", list: ["세안 후 따뜻한 물로 수염을 충분히 적셔요. 마른 수염은 더 당겨요.", "면도 젤이나 거품을 충분히 써서 날이 미끄러지게 해요."] },
      { h: "면도할 때", list: ["처음에는 수염이 난 방향으로 밀어요.", "같은 자리를 여러 번 반복하지 않아요.", "무뎌진 날은 자극을 키워요. 날 상태를 자주 확인해요.", "면도기는 개인용으로 쓰고 공유하지 않아요."] },
      { h: "면도 후", list: ["찬물로 헹군 뒤 수건으로 눌러서 물기를 닦아요.", "향과 알코올 느낌이 강하지 않은 보습제를 발라요."] },
      { h: "이런 경우는 상담을", p: ["붉은 기나 따가움이 며칠 넘게 이어지거나 점점 심해진다면 방법의 문제만은 아닐 수 있어요. 스스로 판단하기보다 의료기관에 상담해요."] },
    ],
  },
  {
    slug: "outdoor-day", area: "skin", modes: ["prepare", "service", "everyday"], kicker: "SKIN · LIFE",
    title: "야외활동이 많은 날 체크리스트",
    summary: "햇빛, 땀, 먼지가 많은 날에 챙길 것만 짧게 정리했어요.",
    read: 2, updated: UPDATED, review: "draft",
    sections: [
      { h: "나가기 전", list: ["자외선 차단제를 평소보다 꼼꼼하게, 목과 귀 뒤까지.", "모자나 그늘을 쓸 수 있으면 함께 활용해요.", "물을 챙겨요."] },
      { h: "활동 중", list: ["가능하면 2~3시간마다 자외선 차단제를 다시 발라요.", "환경이나 규정상 어렵다면 무리하지 말고, 할 수 있는 것만 해요.", "땀은 문지르기보다 눌러서 닦아요."] },
      { h: "끝나고", list: ["가능한 빨리 물로 땀과 먼지를 헹궈요.", "저녁 세안과 보습은 평소대로."] },
    ],
    checklist: { title: "가방 체크", items: ["자외선 차단제", "물", "손수건이나 작은 수건", "립밤"] },
  },
  {
    slug: "px", area: "skin", modes: ["service", "prepare"], kicker: "PX GUIDE",
    title: "PX에서 관리 제품 고르는 기준",
    summary: "어떤 상품이 있는지보다, 어떤 기준으로 고를지를 먼저 정리했어요.",
    read: 3, updated: UPDATED, review: "draft",
    sections: [
      { h: "먼저 알아둘 것", p: ["부대마다 판매 상품과 재고가 다르고 자주 바뀌어요. 이 가이드는 특정 상품의 입점이나 가격을 안내하지 않아요.", "실제 상품 목록은 공개적으로 확인한 범위만, 확인 날짜와 함께 추가할 예정이에요."] },
      { h: "고르는 순서", steps: ["지금 루틴에 비어 있는 단계부터 채워요. 보통 자외선 차단제와 보습제예요.", "인기 순위보다 내 고민을 기준으로 골라요. 당김이 고민이면 보습, 야외활동이 많으면 자외선 차단.", "처음이라면 향이 강하지 않은 기본 제품부터.", "한 번에 여러 개를 바꾸지 않아요. 하나씩, 2주 단위로."] },
      { h: "자주 하는 실수", list: ["인기라는 이유만으로 여러 제품을 한꺼번에 사서 같이 쓰기", "기능성 제품을 기본 단계보다 먼저 들이기", "따가운데도 '적응 중'이라고 계속 쓰기"] },
      { h: "기록해 두면 좋은 것", p: ["쓴 제품의 종류, 시작한 날, 느낌을 짧게 적어 두면 전역 후 같은 제품을 찾거나 바꿀 때 도움이 돼요. 제품 기록(My Shelf) 기능은 다음 업데이트에 준비 중이에요."] },
    ],
  },
  {
    slug: "leave-prep", area: "skin", modes: ["service", "prepare", "next", "everyday"], kicker: "BEFORE THE VISIT",
    title: "피부과 상담 전에 정리해 갈 것",
    summary: "휴가나 외출 중 진료를 받을 계획이라면, 짧은 시간에 정확히 상담받을 수 있도록 미리 메모해 가요.",
    read: 2, updated: UPDATED, review: "draft", medicalNotice: true,
    sections: [
      { h: "이 페이지는", p: ["진단이나 병원 추천이 아니라, 상담을 준비하는 메모 목록이에요. 증상의 원인과 치료는 의료진과 상의해요."] },
      { h: "메모할 것", list: ["언제부터, 어느 부위에 생겼는지", "더 심해지는 때가 있는지 (예: 면도 후, 운동 후)", "최근에 바꾼 제품이나 생활 변화", "지금 쓰고 있는 제품 이름", "복용 중인 약이나 영양제가 있다면 그 이름", "가장 묻고 싶은 질문 2~3개"] },
      { h: "상담 후", list: ["안내받은 사용법과 주의사항을 바로 적어 둬요.", "부대 복귀 후 이어갈 수 있는 방법인지 함께 물어봐요."] },
    ],
    checklist: { title: "가기 전 확인", items: ["증상 메모", "사용 중 제품 목록", "질문 2~3개", "진료 가능 시간 확인"] },
  },
  {
    slug: "before-enlistment", area: "life", modes: ["prepare"], kicker: "PREPARE",
    title: "입대 전 자기관리 습관 점검하기",
    summary: "입대 전 몇 주 동안 기본 루틴을 몸에 익혀 두면, 환경이 바뀌어도 이어가기 쉬워요.",
    read: 3, updated: UPDATED, review: "draft",
    sections: [
      { h: "지금 할 수 있는 것", steps: ["아침 · 저녁 세안과 보습을 매일 같은 시간에 해 보기", "자외선 차단제를 습관으로 만들기", "면도 방법 점검하기 (면도 가이드 참고)", "쓰고 있는 제품 종류를 메모해 두기"] },
      { h: "준비물은 공식 안내 기준으로", p: ["실제로 가져갈 수 있는 물품과 규정은 입영 안내문과 공식 안내를 기준으로 해요. 이 가이드는 지참 물품 목록을 대신하지 않아요."] },
      { h: "마음가짐", p: ["모든 복무 환경이 같지 않아서, 관리에 쓸 수 있는 시간도 사람마다 달라요. 할 수 있는 만큼만 이어가도 충분해요."] },
    ],
    checklist: { title: "입대 전 점검", items: ["기초 3단계 2주 해보기", "면도 방법 점검", "쓰는 제품 메모", "공식 입영 안내 확인"] },
  },
  {
    slug: "next-chapter", area: "style", modes: ["next", "everyday"], kicker: "NEXT CHAPTER",
    title: "전역 후 루틴을 다시 짜는 순서",
    summary: "생활 시간, 활동량, 쓸 수 있는 제품이 모두 바뀌어요. 그동안의 습관은 살리고 순서만 다시 잡아요.",
    read: 3, updated: UPDATED, review: "draft",
    sections: [
      { h: "1. 지금 루틴에서 지킬 것", p: ["매일 하던 세안 · 보습 · 자외선 차단은 그대로 이어가요. 이게 가장 큰 자산이에요."] },
      { h: "2. 바뀐 일상 확인", list: ["기상 · 취침 시간", "운동할 수 있는 시간과 장소", "외출 · 약속이 잦은지"] },
      { h: "3. 하나씩 더하기", steps: ["헤어: 기르는 중이라면 다듬는 주기부터 정해요.", "스타일: 사이즈가 맞는 기본 옷 몇 벌이 먼저예요.", "향: 쓴다면 은은하게, 한 군데만."] },
      { h: "4. RE:BOOT에서", p: ["MY RE:BOOT에서 생활 모드를 '전역 후'로 바꾸면 기록은 그대로 두고 추천 내용만 바뀌어요."] },
    ],
  },
  {
    slug: "workout-skin", area: "body", modes: ALL, kicker: "BODY",
    title: "운동 · 땀 · 피부, 원인을 단정하지 않기",
    summary: "운동 후 피부가 불편할 때 확인할 기본 습관과, 원인을 하나로 단정하면 안 되는 이유.",
    read: 3, updated: UPDATED, review: "draft",
    sections: [
      { h: "먼저 확인할 습관", list: ["운동 후 가능한 빨리 씻는지", "땀에 젖은 옷을 오래 입고 있지 않은지", "수건과 운동 장갑 등을 자주 세탁하는지", "얼굴을 자주 만지지 않는지"] },
      { h: "원인을 단정하지 않기", p: ["피부 상태는 수면, 스트레스, 제품, 계절, 개인 체질 등 여러 요인이 겹쳐 나타나요. 특정 음식이나 보충제 하나를 원인으로 단정하기는 어려워요.", "불편함이 이어지면 스스로 원인을 찾기보다 의료기관에 상담해요."] },
      { h: "운동 루틴과 함께", list: ["운동 전후 5분 스트레칭", "운동 한 줄 기록으로 무리하지 않기"] },
    ],
  },
  {
    slug: "hair-growing", area: "style", modes: ["next", "everyday"], kicker: "STYLE",
    title: "머리 기를 때 처음 3개월",
    summary: "짧은 머리에서 원하는 길이까지 가는 동안 어색한 시기를 덜 어색하게 넘기는 방법.",
    read: 3, updated: UPDATED, review: "draft",
    sections: [
      { h: "1개월 차", list: ["옆과 뒤만 정리하고 윗머리는 그대로 둬요.", "감은 뒤 두피까지 완전히 말려요."] },
      { h: "2개월 차", list: ["뜨는 부분이 생기면 드라이로 방향을 잡아요.", "스타일링 제품은 소량부터."] },
      { h: "3개월 차", list: ["원하는 스타일 사진을 들고 다듬는 시기를 상의해요.", "다듬는 주기를 정해 두면 계속 정돈돼 보여요."] },
    ],
  },
  {
    slug: "sleep-reset", area: "life", modes: ALL, kicker: "LIFE",
    title: "수면과 하루 리듬 정리",
    summary: "관리의 바탕은 결국 잠과 하루 리듬이에요. 바꾸기 쉬운 것부터.",
    read: 2, updated: UPDATED, review: "draft",
    sections: [
      { h: "작은 것부터", list: ["매일 비슷한 시간에 일어나기", "자기 10분 전 화면 내려놓기 (사용 규정이 있는 곳에서는 규정을 따라요)", "아침에 물 한 병 채워 두기"] },
      { h: "기록하기", p: ["루틴에서 '오늘 한 줄 회고'를 켜 두면, 잘 잔 날과 아닌 날의 차이를 스스로 볼 수 있어요."] },
    ],
  },
];

export const getGuide = (slug: string) => GUIDES.find((g) => g.slug === slug);
