import type { Guide } from "./guides.ts";
import type { Mode } from "../lib/types.ts";

// CARE 가이드 2차분. 모두 일반 생활 관리 정보이고 전문가 검수 전(draft)이다.
// 진단 · 치료 · 효과 보장 표현은 쓰지 않는다. 증상이 이어지면 의료기관 상담을 안내한다.

const ALL: Mode[] = ["prepare", "service", "next", "everyday"];
const U = "2026-11-19";

export const MORE_GUIDES: Guide[] = [
  // ───────── SKIN ─────────
  {
    slug: "sunscreen-how", area: "skin", modes: ALL, kicker: "SKIN · 03",
    title: "자외선 차단제, 얼마나 어떻게 바르나요",
    summary: "바르는 양과 다시 바르는 타이밍만 알아도 절반은 해결돼요. 귀 뒤와 목까지가 한 세트예요.",
    read: 3, updated: U, review: "draft", image: "sunscreen",
    sections: [
      { h: "양은 생각보다 많이", p: ["얼굴 전체 기준으로 검지와 중지 두 마디에 짤 정도가 흔히 권장되는 양이에요. 처음엔 많다고 느껴질 수 있어요.", "한 번에 다 바르기 어렵다면 두 번에 나눠 얇게 겹쳐 발라요."] },
      { h: "순서", steps: ["세안 → 보습제까지 마치고 1~2분 기다려요.", "이마 · 양 볼 · 코 · 턱에 점처럼 나눠 올려요.", "안쪽에서 바깥쪽으로 펴 바르고, 귀 뒤 · 목 · 뒷목까지 마무리해요.", "외출 15분 전쯤 끝내 두면 밀림이 덜해요."] },
      { h: "다시 바르기", list: ["야외에 오래 있는 날은 2~3시간마다 덧발라요.", "땀을 많이 흘렸거나 수건으로 닦았다면 그때 다시 발라요.", "스틱이나 쿠션 타입은 덧바르기 편해서 주머니에 하나 두기 좋아요."] },
      { h: "흔한 실수", list: ["흐린 날은 안 발라도 된다고 생각하기", "얼굴만 바르고 목과 귀를 빼먹기", "저녁에 물세안만 하기 (세안제로 지워요)"] },
    ],
    checklist: { title: "외출 전 체크", items: ["두 마디 양", "귀 뒤 · 목까지", "덧바를 제품 챙기기"] },
  },
  {
    slug: "cleanser-pick", area: "skin", modes: ALL, kicker: "SKIN · 01",
    title: "세안제 고르는 기준, 이 세 가지만",
    summary: "세안 후 당기지 않는지, 향이 강하지 않은지, 하루 두 번 써도 편한지. 비싼 게 정답은 아니에요.",
    read: 3, updated: U, review: "draft", image: "wash",
    sections: [
      { h: "고를 때 보는 것", list: ["세안 직후 얼굴이 심하게 당기면 나와 안 맞을 수 있어요.", "향이 강한 제품은 처음엔 피하는 편이 무난해요.", "거품형 · 젤형 · 크림형 중 쓰기 편한 걸로. 형태보다 꾸준함이 중요해요."] },
      { h: "세안 방법", steps: ["손을 먼저 씻어요.", "미지근한 물로 얼굴을 적셔요.", "세안제를 손에서 충분히 거품 낸 뒤 문질러요. 30초~1분이면 충분해요.", "헤어라인 · 턱선 · 콧볼에 거품이 남지 않게 헹궈요.", "수건으로 문지르지 말고 눌러서 닦아요."] },
      { h: "이건 피해요", list: ["뜨거운 물로 오래 세안하기", "때 밀듯 세게 문지르기", "하루 세 번 이상 세안제 쓰기"] },
    ],
  },
  {
    slug: "oily-skin", area: "skin", modes: ALL, kicker: "SKIN",
    title: "오후만 되면 번들거릴 때 해볼 것",
    summary: "기름이 많다고 세안을 늘리면 오히려 당김과 번들거림이 같이 오기 쉬워요. 순서부터 점검해요.",
    read: 3, updated: U, review: "draft", image: "blot2",
    sections: [
      { h: "먼저 확인", list: ["하루 세안 횟수가 너무 많지 않은지", "보습을 아예 빼고 있지는 않은지", "자외선 차단제가 너무 무겁지 않은지"] },
      { h: "바꿔볼 것", list: ["보습제는 가벼운 젤 · 로션 타입으로 얇게.", "낮에는 세안 대신 기름종이로 눌러 닦기.", "베개 커버와 수건을 자주 갈기.", "휴대폰 화면을 가끔 닦기. 볼에 닿는 면이에요."] },
      { h: "주의", p: ["번들거림과 함께 붉고 아픈 트러블이 계속 생긴다면 생활 관리만으로 판단하지 말고 의료기관에 상담해요."] },
    ],
  },
  {
    slug: "dry-skin-winter", area: "skin", modes: ALL, kicker: "SKIN · SEASON",
    title: "겨울에 얼굴이 당기고 하얗게 일어날 때",
    summary: "실내 난방과 찬바람이 겹치는 계절이에요. 보습 타이밍과 세안 온도만 바꿔도 체감이 달라요.",
    read: 3, updated: U, review: "draft",
    sections: [
      { h: "생활에서", list: ["세안 물 온도는 미지근하게.", "세안 후 1분 안에 보습제.", "자기 전 보습제를 한 번 더 얇게.", "실내가 건조하면 젖은 수건을 널어 두는 것도 방법이에요."] },
      { h: "각질이 보일 때", p: ["일어난 각질을 손으로 뜯거나 세게 문지르면 더 예민해질 수 있어요. 보습을 꾸준히 하면서 가라앉기를 기다리는 편이 무난해요."] },
      { h: "입술 · 손도 같이", list: ["립밤은 주머니에 하나.", "손 씻은 뒤 핸드크림.", "갈라져서 아프거나 피가 나면 상담을 받아요."] },
    ],
  },
  {
    slug: "breakout-dont", area: "skin", modes: ALL, kicker: "SKIN · CAUTION",
    title: "트러블이 났을 때 하지 말아야 할 것",
    summary: "짜고, 새 제품을 왕창 바르고, 세안을 늘리는 것. 급할수록 줄이는 쪽이 안전해요.",
    read: 2, updated: U, review: "draft", medicalNotice: true,
    sections: [
      { h: "하지 말 것", list: ["손으로 짜거나 뜯기", "한꺼번에 새 제품 여러 개 쓰기", "알코올 느낌 강한 제품으로 닦아내기", "세안 횟수 늘리기", "인터넷에서 본 성분을 진하게 덧바르기"] },
      { h: "할 수 있는 것", list: ["평소 루틴(세안 · 보습 · 자외선 차단)을 단순하게 유지", "베개 커버 · 수건 교체", "얼굴에 손 대는 습관 줄이기"] },
      { h: "상담이 필요한 경우", p: ["통증이 있거나, 넓게 번지거나, 몇 주 넘게 반복된다면 RE:BOOT 가이드로 해결하려 하지 말고 의료기관에 상담해요. 이 글은 진단이나 치료 정보가 아니에요."] },
    ],
  },
  {
    slug: "lip-care", area: "skin", modes: ALL, kicker: "SKIN · MINI",
    title: "입술 트임, 30초 관리",
    summary: "핥지 않기, 립밤 바르기, 물 마시기. 작은 습관 세 개가 전부예요.",
    read: 2, updated: U, review: "draft",
    sections: [
      { h: "습관", list: ["입술을 핥지 않아요. 침이 마르면서 더 건조해져요.", "일어난 껍질은 뜯지 않아요.", "립밤은 세안 후 · 외출 전 · 자기 전 세 번."] },
      { h: "야외에서", p: ["바람이 강하거나 햇볕이 센 날은 립밤을 더 자주 발라요. 자외선 차단 기능이 있는 립밤도 있어요."] },
    ],
  },
  {
    slug: "tired-eyes", area: "skin", modes: ALL, kicker: "SKIN · LIFE",
    title: "피곤해 보인다는 말을 들을 때",
    summary: "눈가는 제품보다 잠과 화면 시간에 먼저 반응해요. 생활부터 점검해요.",
    read: 2, updated: U, review: "draft", image: "blot",
    sections: [
      { h: "먼저 보는 것", list: ["잠드는 시간이 매일 크게 달라지지 않는지", "자기 직전까지 화면을 보는지", "물을 너무 적게 마시지 않는지", "짠 야식이 잦은지"] },
      { h: "아침에", list: ["찬물로 세안하고 가볍게 눌러 닦기", "눈가는 문지르지 말고 톡톡 두드려 보습", "선글라스나 모자로 눈부심 줄이기"] },
    ],
  },
  {
    slug: "after-shave-bumps", area: "skin", modes: ALL, kicker: "SKIN · SHAVE",
    title: "면도 후 오돌토돌한 게 올라올 때",
    summary: "수염이 자라는 방향, 날 상태, 면도 간격을 먼저 바꿔봐요. 계속되면 상담해요.",
    read: 3, updated: U, review: "draft", medicalNotice: true,
    sections: [
      { h: "바꿔볼 것", list: ["역방향 면도 줄이기", "날 자주 교체하기", "면도 간격을 하루 정도 늘려 보기", "면도 직후 꽉 끼는 옷깃 피하기"] },
      { h: "면도 후", list: ["찬물로 헹구기", "자극 적은 보습제", "올라온 부분은 손대지 않기"] },
      { h: "상담", p: ["붓고 아프거나, 고름이 생기거나, 같은 자리에 반복된다면 스스로 처치하지 말고 의료기관에 상담해요."] },
    ],
  },

  // ───────── BODY ─────────
  {
    slug: "desk-stretch", area: "body", modes: ALL, kicker: "BODY · 5MIN",
    title: "오래 앉아 있는 날, 5분 스트레칭",
    summary: "목 · 어깨 · 허리 · 고관절. 의자에서 일어나기만 해도 반은 한 거예요.",
    read: 3, updated: U, review: "draft", image: "stretch",
    sections: [
      { h: "5분 순서", steps: ["일어나서 제자리 걷기 30초", "목을 천천히 좌우로 기울이기, 각 15초", "양손 깍지 끼고 위로 쭉 펴기 20초", "벽 짚고 가슴 열기, 좌우 20초", "의자 잡고 엉덩이 뒤로 빼며 허리 펴기 30초", "한쪽 다리 뒤로 뻗어 고관절 앞쪽 늘이기, 좌우 20초"] },
      { h: "언제", list: ["50분 앉았으면 한 번", "점심 먹고 바로 한 번", "퇴근 직후 한 번"] },
      { h: "주의", p: ["통증이 생기면 멈춰요. 늘이는 느낌까지만, 아프게 하지 않아요."] },
    ],
  },
  {
    slug: "sweat-odor", area: "body", modes: ALL, kicker: "BODY · DAILY",
    title: "땀 냄새, 기본 관리 순서",
    summary: "씻는 법, 말리는 법, 갈아입는 타이밍. 향으로 덮기 전에 순서부터.",
    read: 3, updated: U, review: "draft", image: "gymbag",
    sections: [
      { h: "씻을 때", list: ["겨드랑이 · 등 · 발은 비누 거품으로 한 번 더", "씻은 뒤 물기를 완전히 말리기"] },
      { h: "옷", list: ["땀 많이 흘린 옷은 바로 빨래통으로", "운동복은 젖은 채로 가방에 오래 두지 않기", "속옷 · 양말은 하루 한 번 이상 갈아입기"] },
      { h: "데오도란트", p: ["씻고 완전히 마른 피부에 써요. 향이 강한 제품을 덧뿌리는 것보다 무향 제품을 꾸준히 쓰는 편이 무난해요."] },
    ],
    checklist: { title: "가방에 하나씩", items: ["여분 양말", "작은 수건", "데오도란트"] },
  },
  {
    slug: "bodyweight-start", area: "body", modes: ALL, kicker: "BODY · START",
    title: "맨몸 운동, 주 3회 20분으로 시작",
    summary: "기구 없이 방에서. 횟수보다 매주 같은 요일에 하는 게 먼저예요.",
    read: 4, updated: U, review: "draft", image: "pushup",
    sections: [
      { h: "20분 구성", steps: ["준비운동 3분 (제자리 걷기, 팔 돌리기)", "스쿼트 10회", "무릎 대고 팔굽혀펴기 8회", "플랭크 20초", "런지 좌우 6회씩", "위 4가지를 3바퀴, 바퀴 사이 1분 휴식", "정리운동 3분"] },
      { h: "늘리는 법", list: ["2주 동안 같은 횟수로 자세 익히기", "편해지면 한 동작씩 2회 늘리기", "무릎 팔굽혀펴기가 쉬워지면 일반 자세로"] },
      { h: "주의", p: ["통증이 있거나 질환이 있다면 운동 전에 의료 전문가와 상담해요."] },
    ],
  },
  {
    slug: "posture-check", area: "body", modes: ALL, kicker: "BODY · POSTURE",
    title: "사진 속 내 자세가 구부정해 보일 때",
    summary: "화면 높이, 앉는 깊이, 서 있을 때 무게중심. 생활 환경부터 바꿔봐요.",
    read: 3, updated: U, review: "draft",
    sections: [
      { h: "책상에서", list: ["화면 윗부분이 눈높이 근처에 오게", "엉덩이를 의자 깊숙이", "발바닥이 바닥에 닿게"] },
      { h: "휴대폰", list: ["고개를 숙이지 말고 폰을 올려 보기", "30분마다 고개 뒤로 젖혀 풀기"] },
      { h: "서 있을 때", list: ["양발에 체중을 고르게", "턱을 살짝 당기고 정수리를 위로 늘이는 느낌"] },
    ],
  },
  {
    slug: "foot-care", area: "body", modes: ["prepare", "service", "everyday"], kicker: "BODY · FEET",
    title: "오래 걷고 신발을 오래 신는 날의 발 관리",
    summary: "발은 하루 종일 갇혀 있어요. 씻고, 말리고, 양말을 갈아 신는 게 기본이에요.",
    read: 3, updated: U, review: "draft", image: "shoes",
    sections: [
      { h: "매일", list: ["발가락 사이까지 씻고 완전히 말리기", "양말은 땀이 차면 갈아 신기", "신발은 하루 신었으면 하루 말리기"] },
      { h: "발톱", list: ["너무 짧게, 둥글게 깎지 않기", "일자로 깎고 모서리만 살짝 다듬기"] },
      { h: "상담", p: ["물집이 터져 붓거나 아프면, 발톱 주변이 붉게 부으면 스스로 처치하지 말고 의무실이나 의료기관에 상담해요."] },
    ],
  },

  // ───────── STYLE ─────────
  {
    slug: "hair-dry", area: "style", modes: ["next", "everyday", "prepare"], kicker: "STYLE · HAIR",
    title: "드라이 하나로 머리 모양이 달라지는 순서",
    summary: "제품보다 말리는 방향이 먼저예요. 뿌리부터, 원하는 방향의 반대로.",
    read: 3, updated: U, review: "draft", image: "mirror",
    sections: [
      { h: "순서", steps: ["수건으로 꾹꾹 눌러 물기를 80% 정도 빼요.", "뿌리부터 말려요. 끝부터 말리면 뿌리가 눌려요.", "넘기고 싶은 방향의 반대로 먼저 말렸다가 원래 방향으로 넘기면 볼륨이 살아요.", "마지막에 찬바람으로 모양을 고정해요."] },
      { h: "제품은", list: ["처음엔 하나만. 가벼운 크림이나 왁스 콩알만큼.", "손바닥에 충분히 펴서 뒤에서 앞으로.", "자기 전에는 꼭 씻어내요."] },
    ],
  },
  {
    slug: "barber-talk", area: "style", modes: ALL, kicker: "STYLE · HAIR",
    title: "미용실에서 원하는 머리 설명하는 법",
    summary: "'알아서 깔끔하게' 대신 사진 두 장과 단어 세 개. 실패 확률이 확 줄어요.",
    read: 3, updated: U, review: "draft", image: "barber",
    sections: [
      { h: "준비", list: ["원하는 머리 사진 2장 (정면 · 옆)", "싫은 머리 사진 1장도 있으면 좋아요", "평소 손질에 쓸 수 있는 시간 (5분 · 10분)"] },
      { h: "말할 것", list: ["옆머리 · 뒷머리를 얼마나 짧게 (예: 귀가 살짝 보이게)", "앞머리를 내릴지 올릴지", "다음 커트까지 몇 주 버틸지"] },
      { h: "자르고 나서", p: ["손질법을 직접 물어봐요. 어떤 방향으로 말리고, 제품은 얼마나 쓰는지. 그게 다음 날 아침을 결정해요."] },
    ],
  },
  {
    slug: "fragrance-start", area: "style", modes: ["next", "everyday"], kicker: "STYLE · SCENT",
    title: "향수 처음 고를 때, 덜 실패하는 법",
    summary: "시향지 말고 피부에. 30분 뒤 냄새로 고르고, 뿌리는 건 두 번이면 충분해요.",
    read: 3, updated: U, review: "draft",
    sections: [
      { h: "고르기", list: ["한 번에 세 개 이상 맡지 않기", "손목에 뿌리고 30분 뒤 다시 맡기", "처음엔 가볍고 깨끗한 계열이 무난해요"] },
      { h: "뿌리기", list: ["샤워 후 마른 피부에", "손목 · 목 뒤 중 두 군데, 한 번씩", "옷이 아니라 피부에"] },
      { h: "주의", p: ["밀폐된 공간이나 단체 생활에서는 향이 생각보다 멀리 가요. 더 적게."] },
    ],
  },
  {
    slug: "basic-wardrobe", area: "style", modes: ["next", "everyday"], kicker: "STYLE · CLOTHES",
    title: "전역 후 옷장, 기본 7벌부터",
    summary: "유행보다 맞는 사이즈. 서로 다 어울리는 7벌로 2주를 버틸 수 있어요.",
    read: 4, updated: U, review: "draft", image: "shirt",
    sections: [
      { h: "7벌", list: ["흰 셔츠 1", "무지 티셔츠 흰색 · 검정 각 1", "니트 또는 맨투맨 1", "슬랙스 1", "생지 데님 1", "가벼운 아우터 1"] },
      { h: "고르는 기준", list: ["어깨선이 내 어깨 끝에 맞는지", "바지는 앉았을 때 불편하지 않은지", "색은 흰 · 검 · 회 · 남색 안에서"] },
      { h: "신발", p: ["깨끗한 흰 스니커즈 하나와 검정 구두나 더비 하나면 대부분의 자리가 해결돼요."] },
    ],
  },
  {
    slug: "fit-check", area: "style", modes: ["next", "everyday"], kicker: "STYLE · FIT",
    title: "옷 살 때 핏 체크 포인트 5",
    summary: "같은 옷도 사이즈 하나로 달라 보여요. 거울 앞에서 이것만 확인해요.",
    read: 2, updated: U, review: "draft",
    sections: [
      { h: "체크", list: ["어깨 봉제선이 어깨 끝에 오는지", "소매가 손목뼈를 살짝 덮는지", "셔츠 단추 사이가 벌어지지 않는지", "바지 밑단이 신발 위에서 한 번만 접히는지", "팔을 들어도 옷이 크게 딸려 올라오지 않는지"] },
    ],
  },
  {
    slug: "hand-nail", area: "style", modes: ALL, kicker: "STYLE · DETAIL",
    title: "손톱과 손, 은근히 보이는 디테일",
    summary: "악수할 때, 폰 볼 때 다 보여요. 주 1회 5분이면 충분해요.",
    read: 2, updated: U, review: "draft", image: "moisture",
    sections: [
      { h: "주 1회", steps: ["샤워 후 손톱이 부드러울 때 깎기", "일자로 깎고 모서리만 줄로 다듬기", "거스러미는 뜯지 말고 깎기", "핸드크림으로 마무리"] },
      { h: "매일", list: ["손 씻은 뒤 물기 완전히 닦기", "손톱 물어뜯는 습관 대신 손에 할 일 주기"] },
    ],
  },

  // ───────── LIFE ─────────
  {
    slug: "water-habit", area: "life", modes: ALL, kicker: "LIFE · DAILY",
    title: "물 마시는 습관, 컵 하나로 시작",
    summary: "목표량보다 타이밍. 일어나서, 식사 전, 운동 후에 한 컵씩.",
    read: 2, updated: U, review: "draft", image: "cup",
    sections: [
      { h: "타이밍", list: ["일어나자마자 한 컵", "점심 · 저녁 전 한 컵", "운동하고 나서 한 컵", "자기 직전은 조금만"] },
      { h: "쉽게 하는 법", list: ["눈에 보이는 곳에 컵 두기", "루틴의 '세안' 옆에 '물 한 컵' 붙이기"] },
      { h: "주의", p: ["질환이 있어 물 섭취를 조절해야 한다면 의료진 안내를 따라요."] },
    ],
  },
  {
    slug: "morning-10min", area: "life", modes: ALL, kicker: "LIFE · MORNING",
    title: "아침 10분 루틴 짜는 법",
    summary: "일어나서 휴대폰보다 세면대가 먼저. 순서를 고정하면 생각할 게 없어져요.",
    read: 3, updated: U, review: "draft", image: "fogmirror",
    sections: [
      { h: "10분 예시", steps: ["물 한 컵 (1분)", "세안 (2분)", "보습 (1분)", "자외선 차단 (1분)", "머리 정리 (3분)", "옷 입고 거울 한 번 (2분)"] },
      { h: "고정하는 팁", list: ["전날 밤 옷과 가방 준비", "세면대 위에 쓰는 순서대로 제품 배치", "RE:BOOT 루틴 체크로 빠진 것만 확인"] },
    ],
  },
  {
    slug: "phone-night", area: "life", modes: ALL, kicker: "LIFE · NIGHT",
    title: "자기 전 휴대폰, 30분만 줄여보기",
    summary: "완전히 끊기보다 침대 밖에 두기. 알람은 다른 걸로.",
    read: 2, updated: U, review: "draft",
    sections: [
      { h: "해볼 것", list: ["충전기를 침대에서 손 안 닿는 곳에", "자기 30분 전 알림 끄기", "그 시간에 저녁 루틴(세안 · 보습)", "내일 할 일 3개 종이에 적기"] },
      { h: "잘 안 될 때", p: ["하루 만에 바꾸려 하지 말고 10분씩 당겨요. 일주일이면 30분이에요."] },
    ],
  },
  {
    slug: "laundry-basics", area: "life", modes: ["prepare", "next", "everyday"], kicker: "LIFE · HOME",
    title: "혼자 사는 남자 빨래 기본",
    summary: "색 분리, 뒤집어 빨기, 바로 널기. 이 세 개로 옷 수명이 길어져요.",
    read: 3, updated: U, review: "draft",
    sections: [
      { h: "빨기 전", list: ["흰 옷 · 어두운 옷 따로", "청바지 · 프린트 티는 뒤집어서", "주머니 확인"] },
      { h: "빤 다음", list: ["끝나면 바로 꺼내서 털어 널기", "셔츠는 옷걸이에 걸어 말리기", "니트는 눕혀서 말리기"] },
      { h: "수건", p: ["수건은 따로, 섬유유연제는 적게. 흡수가 잘 돼요."] },
    ],
  },

  // ───────── SERVICE ─────────
  {
    slug: "barracks-kit", area: "skin", modes: ["service", "prepare"], kicker: "SERVICE · KIT",
    title: "생활관에서 쓰기 좋은 최소 관리 키트",
    summary: "공간도 시간도 적을 때는 개수를 줄여요. 세 개 + 립밤이면 충분해요.",
    read: 3, updated: U, review: "draft", image: "kit",
    sections: [
      { h: "기본 4개", list: ["순한 세안제", "보습제 (몸에도 쓸 수 있는 것)", "자외선 차단제 (스틱 · 튜브)", "립밤"] },
      { h: "고르는 기준", list: ["작은 용량, 뚜껑이 잘 닫히는 것", "향이 강하지 않은 것", "PX에서 다시 살 수 있는 것"] },
      { h: "참고", p: ["부대마다 반입 · 보관 규정이 달라요. 먼저 확인하고 그 안에서 골라요."] },
    ],
    checklist: { title: "챙길 것", items: ["세안제", "보습제", "자외선 차단제", "립밤"] },
  },
  {
    slug: "outdoor-training", area: "skin", modes: ["service"], kicker: "SERVICE · FIELD",
    title: "야외 훈련 전후, 3분 관리",
    summary: "훈련 전엔 차단, 훈련 후엔 씻고 진정. 시간이 없을수록 순서를 지켜요.",
    read: 3, updated: U, review: "draft",
    sections: [
      { h: "전", list: ["자외선 차단제 얼굴 · 목 · 귀", "립밤", "땀 닦을 작은 수건"] },
      { h: "후", list: ["가능한 빨리 세안", "보습제", "젖은 양말은 바로 갈아 신기"] },
      { h: "주의", p: ["화끈거림이나 물집이 생기면 의무실에 먼저 알려요."] },
    ],
  },
  {
    slug: "first-leave", area: "style", modes: ["service"], kicker: "SERVICE · LEAVE",
    title: "첫 휴가 전 일주일 준비",
    summary: "피부는 하루 만에 안 바뀌어요. 휴가 일주일 전부터 루틴을 조금 더 챙겨요.",
    read: 3, updated: U, review: "draft",
    sections: [
      { h: "D-7", list: ["보습을 하루 두 번으로", "자외선 차단 빼먹지 않기", "물 자주 마시기"] },
      { h: "D-3", list: ["손톱 정리", "입을 사복 미리 확인", "새 제품은 지금 시작하지 않기"] },
      { h: "D-1", list: ["면도는 전날 저녁보다 당일 아침에 여유 있게", "일찍 자기"] },
    ],
  },
  {
    slug: "interview-day", area: "style", modes: ["next", "everyday"], kicker: "NEXT · INTERVIEW",
    title: "면접 전날과 당일 아침 체크",
    summary: "새로운 걸 시도하는 날이 아니에요. 평소 루틴을 정확히 하는 날이에요.",
    read: 3, updated: U, review: "draft",
    sections: [
      { h: "전날", list: ["옷 다려 걸어두기", "구두 닦기", "손톱 정리", "새 제품 · 새 향수 쓰지 않기", "일찍 자기"] },
      { h: "당일 아침", list: ["면도는 시간 여유 있게", "보습 · 자외선 차단", "머리 정리하고 손에 남은 제품 씻기", "거울로 뒷모습 · 옷깃 확인"] },
    ],
    checklist: { title: "가방", items: ["기름종이", "립밤", "작은 빗", "물티슈"] },
  },
];
