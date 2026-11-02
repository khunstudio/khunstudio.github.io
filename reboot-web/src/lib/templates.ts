import type { Area, Concern, Mode, Situation, Slot } from "./types.ts";

// 루틴 항목 템플릿. 모든 문구는 일반적인 생활 관리 정보이며 진단·처방이 아니다.
// 특정 브랜드 제품을 추천하지 않고 제품 "종류"만 말한다.

export interface Template {
  id: string;
  title: string;
  slot: Slot;
  area: Area;
  minutes: number;
  why: string;
  how: string;
  guide?: string;
  /** 누구에게나 들어가는 기본 항목 */
  core?: boolean;
  /** 기본 우선순위 (높을수록 먼저) */
  base: number;
  modes?: Mode[];
  areas?: Area[];
  concerns?: Concern[];
  /** 지정 시 해당 상황에서만 보이는 추가 항목 (시간 예산에 포함하지 않음) */
  situations?: Situation[];
  minMinutes?: 3 | 5 | 10;
}

export const TEMPLATES: Template[] = [
  // ── 기본 (core) ──
  {
    id: "am-cleanse", title: "아침 세안", slot: "am", area: "skin", minutes: 0.5, core: true, base: 100,
    why: "자는 동안 생긴 유분과 땀을 정리하면 다음 단계가 잘 흡수됩니다.",
    how: "미지근한 물로 얼굴을 적시고, 필요하면 순한 세안제를 소량만 써서 30초 안에 헹궈요.",
    guide: "skin-basics",
  },
  {
    id: "am-moisturize", title: "보습제 바르기", slot: "am", area: "skin", minutes: 0.5, core: true, base: 98,
    why: "세안 뒤 피부가 당기는 느낌을 줄이고 하루를 편하게 보낼 수 있어요.",
    how: "물기가 조금 남았을 때 콩알만큼 덜어 얼굴 전체에 얇게 펴 발라요.",
    guide: "skin-basics",
  },
  {
    id: "am-sunscreen", title: "자외선 차단제", slot: "am", area: "skin", minutes: 0.5, core: true, base: 99,
    why: "햇빛은 실내외를 가리지 않고 피부에 영향을 줍니다. 기초 관리에서 가장 꾸준히 할 항목이에요.",
    how: "보습 다음, 손가락 두 마디 정도 양을 얼굴과 목에 고르게 발라요.",
    guide: "skin-basics",
  },
  {
    id: "pm-cleanse", title: "저녁 세안", slot: "pm", area: "skin", minutes: 1, core: true, base: 97,
    why: "자외선 차단제와 하루 동안의 땀·먼지는 물만으로 잘 지워지지 않아요.",
    how: "세안제를 거품 내어 1분 정도 문지르고 미지근한 물로 충분히 헹궈요.",
    guide: "skin-basics",
  },
  {
    id: "pm-moisturize", title: "자기 전 보습", slot: "pm", area: "skin", minutes: 0.5, core: true, base: 96,
    why: "세안 직후에는 수분이 빨리 날아갑니다. 바로 보습하면 아침이 덜 건조해요.",
    how: "세안 후 1분 안에 보습제를 얇게 펴 발라요.",
    guide: "skin-basics",
  },

  // ── 고민 · 관심에 따라 추가 ──
  {
    id: "shave-prep", title: "면도 전 수염 불리기", slot: "am", area: "skin", minutes: 0.5, base: 40, concerns: ["shave"],
    why: "수염이 부드러워야 같은 면도도 덜 당기고 자극이 줄어듭니다.",
    how: "세안 뒤 따뜻한 물로 수염 부위를 30초 이상 적시고, 면도 젤이나 거품을 충분히 써요.",
    guide: "shaving",
  },
  {
    id: "shave-after", title: "면도 후 진정·보습", slot: "am", area: "skin", minutes: 0.5, base: 42, concerns: ["shave"],
    why: "면도 직후 피부는 예민해져 있어요. 알코올 향이 강한 제품은 따가울 수 있습니다.",
    how: "찬물로 헹군 뒤 향과 자극이 적은 보습제를 발라요. 같은 자리를 여러 번 밀지 않았는지도 점검해요.",
    guide: "shaving",
  },
  {
    id: "dry-extra", title: "건조한 부위 한 번 더", slot: "pm", area: "skin", minutes: 0.5, base: 36, concerns: ["dryness"],
    why: "볼·입가처럼 쉽게 당기는 부위만 얇게 덧바르면 충분해요.",
    how: "보습 후 당기는 부위에만 소량을 한 겹 더 발라요.",
    guide: "skin-basics",
  },
  {
    id: "lip-hand", title: "입술 · 손 보습", slot: "pm", area: "skin", minutes: 0.5, base: 24, concerns: ["dryness", "outdoor"],
    why: "입술과 손은 피지가 적어 건조해지기 쉬운 곳이에요.",
    how: "립밤과 핸드크림을 자기 전에 한 번씩.",
  },
  {
    id: "sweat-rinse", title: "땀 흘린 뒤 바로 씻기", slot: "pm", area: "body", minutes: 1, base: 34, concerns: ["sweat"], areas: ["body"],
    why: "땀과 유분이 오래 남아 있으면 불편함이 커질 수 있어요. 원인을 단정하기보다 기본 위생부터 챙겨요.",
    how: "운동·활동 후 가능한 빨리 얼굴과 몸을 헹구고, 젖은 옷은 갈아입어요.",
    guide: "workout-skin",
  },
  {
    id: "stretch", title: "5분 스트레칭", slot: "am", area: "body", minutes: 2, base: 22, areas: ["body"], minMinutes: 5,
    why: "굳은 몸을 풀어두면 하루 컨디션과 자세에 도움이 됩니다.",
    how: "목·어깨·허리·햄스트링을 각 30초씩 천천히 늘려요. 아프면 멈춰요.",
    guide: "workout-skin",
  },
  {
    id: "workout-log", title: "운동 한 줄 기록", slot: "pm", area: "body", minutes: 1, base: 18, areas: ["body"], minMinutes: 10,
    why: "무엇을 얼마나 했는지 적어 두면 무리하지 않고 꾸준히 늘릴 수 있어요.",
    how: "종목 · 세트 · 느낌을 한 줄로 메모해요.",
  },
  {
    id: "hair-dry", title: "두피까지 말리기", slot: "pm", area: "style", minutes: 2, base: 20, areas: ["style"], minMinutes: 5,
    why: "겉머리만 마르고 두피가 젖어 있으면 냄새와 불편함이 생기기 쉬워요.",
    how: "수건으로 꾹꾹 눌러 물기를 뺀 뒤, 드라이어는 두피부터 말려요.",
    guide: "hair-growing",
  },
  {
    id: "mirror-check", title: "외출 전 거울 30초", slot: "am", area: "style", minutes: 0.5, base: 16, areas: ["style"],
    why: "머리 뻗침, 눈썹·코털, 옷 구김처럼 작은 것만 정리해도 인상이 정돈돼 보여요.",
    how: "정면 · 옆모습을 한 번씩 보고 눈에 띄는 것 하나만 고쳐요.",
    guide: "next-chapter",
  },
  {
    id: "water", title: "물 한 병 채우기", slot: "am", area: "life", minutes: 0.5, base: 14, areas: ["life", "body"],
    why: "물을 가까이 두면 마시는 양을 챙기기 쉬워요.",
    how: "아침에 물병을 채워 눈에 보이는 곳에 둬요.",
    guide: "sleep-reset",
  },
  {
    id: "screen-off", title: "잠들기 전 화면 끄기", slot: "pm", area: "life", minutes: 1, base: 15, areas: ["life"], minMinutes: 5,
    why: "잠들기 직전까지 화면을 보면 잠드는 데 시간이 더 걸릴 수 있어요.",
    how: "자기 10분 전에 휴대폰을 내려놓고 다음 날 알람만 확인해요. 사용 규정이 있는 곳에서는 그 규정을 따라요.",
    guide: "sleep-reset",
  },
  {
    id: "reflect", title: "오늘 한 줄 회고", slot: "pm", area: "life", minutes: 1, base: 12, areas: ["life"], minMinutes: 10,
    why: "잘한 것 하나를 적으면 다음 날 이어가기 쉬워요.",
    how: "오늘 지킨 것 하나, 내일 바꿀 것 하나를 짧게 적어요.",
  },
  {
    id: "enlist-checklist", title: "입대 준비 목록 하나 확인", slot: "pm", area: "life", minutes: 1, base: 26, modes: ["prepare"],
    why: "한 번에 몰아서 준비하면 빠뜨리기 쉬워요. 하루에 하나씩이면 부담이 적어요.",
    how: "가이드의 준비 목록에서 오늘 하나를 확인해요. 실제 지참 물품은 입영 안내문을 기준으로 해요.",
    guide: "before-enlistment",
  },

  // ── 상황별 추가 (시간 예산 밖) ──
  {
    id: "sunscreen-reapply", title: "자외선 차단제 덧바르기", slot: "am", area: "skin", minutes: 0.5, base: 50, situations: ["active"],
    why: "밖에 오래 있는 날은 땀과 마찰로 차단제가 지워지기 쉬워요.",
    how: "가능하면 2~3시간마다 얼굴과 목에 다시 발라요. 환경상 어렵다면 모자·그늘을 활용해요.",
    guide: "outdoor-day",
  },
  {
    id: "after-active-rinse", title: "활동 후 가볍게 세안", slot: "pm", area: "skin", minutes: 0.5, base: 48, situations: ["active"],
    why: "땀과 먼지를 오래 두지 않는 것이 가장 기본적인 관리예요.",
    how: "활동이 끝나면 물로 먼저 헹구고, 저녁 세안은 평소대로 해요.",
    guide: "outdoor-day",
  },
  {
    id: "out-grooming", title: "외출 전 그루밍 체크", slot: "am", area: "style", minutes: 1, base: 46, situations: ["out"],
    why: "오랜만의 외출·약속이라면 머리·눈썹·손톱만 정리해도 충분히 깔끔해 보여요.",
    how: "머리 정돈, 눈썹·코털 확인, 손톱 길이 확인 순서로 1분.",
    guide: "next-chapter",
  },
  {
    id: "out-clinic-note", title: "상담 준비 메모 확인", slot: "am", area: "skin", minutes: 0.5, base: 44, situations: ["out"], modes: ["service"],
    why: "휴가·외출 중 의료기관에 갈 계획이 있다면 미리 적은 메모가 상담 시간을 아껴 줍니다.",
    how: "증상이 시작된 시기, 쓰고 있는 제품, 묻고 싶은 것을 메모했는지 확인해요.",
    guide: "leave-prep",
  },
];
