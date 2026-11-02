# RE:BOOT Web MVP — 설계 문서

기준 문서: `RE:BOOT WEB-FIRST MASTER PLAN v2.0` (2026-11-03)
프로젝트 상태: **Prototype** (공개 배포 전, 실제 이용자·제휴·매출 없음)

---

## A. 1차 웹 MVP 화면 목록과 IA

```text
/                       HOME          브랜드 소개 + (기록이 있으면) 오늘의 요약
/start                  시작하기      생활 모드 4종 선택 (로그인 없음)
/check                  30초 체크     6문항 룰 기반 체크 (의학적 진단 아님)
/check/result           결과          지금 할 행동 3가지 + 가이드 링크 + 루틴 저장
/routine                오늘의 루틴   아침/저녁, 생활 상황 전환, 체크, 항목 제외/복구
/my                     MY RE:BOOT    7/30일 기록, 생활 모드 변경, 공유 카드, 내보내기/삭제
/care                   CARE 허브     SKIN · BODY · STYLE · LIFE 필터 + 검색
/care/skin|body|style|life            영역별 가이드 목록
/care/<guide>           가이드 본문   (px, leave-prep 포함)
/crew                   CREW          문화 소개 + "베타 준비 중" (게시판 없음)
/select                 SELECT        큐레이션 방향 소개 + "준비 중" (상품·가격·구매 버튼 없음)
/about                  소개          미션, 운영 주체, 검수 원칙, 프로젝트 상태
/partnership            협업          협업 원칙 + 문의 경로
/legal/privacy|terms|community|advertising   초안 (법률 검토 전 표시)
```

내비게이션
- 모바일 하단: `TODAY / CARE / ROUTINE / MY` (실제 동작하는 메뉴만)
- 데스크톱 상단: `CARE · ROUTINE · CREW[Beta 준비] · SELECT[Coming Soon] · MY · 시작하기`
- CREW·SELECT는 상단·푸터에서만 노출하고 상태 배지를 붙인다.

## B. 핵심 사용자 흐름

1. **첫 방문 (모든 사용자)**
   HOME → "무료로 시작하기" → /start 모드 선택 → /check 6문항 → /check/result → "이 루틴으로 시작" → /routine
2. **복무 중 (여정 A)**
   SNS 링크 → /care/px → 하단 CTA "30초 체크" → 루틴 저장 → 매일 /routine 체크 → /my 7일 기록 → 전역 시 모드 변경, 루틴 유지
3. **입대 예정 (여정 B)**
   /care/before-enlistment → 체크 → 기초 루틴 → 입대 후 모드를 "복무 중"으로 변경하면 상황 라벨이 바뀌고 기록은 유지
4. **일반 사용자 (여정 C)**
   /care/skin-basics → 체크 (모드: 일반) → 루틴 → 공유 카드
5. **생활 단계 전환**
   /my → 모드 변경 → "다음 일상에 맞게 루틴을 업데이트할까요?" → [그대로 유지] 또는 [새 모드로 다시 구성] (기록은 항상 유지)

## C. 디자인 토큰 / 컴포넌트

톤: Bold · Minimal · Editorial · Clean. 군복·계급·카운트다운·위장무늬, 글로우·메탈·과한 그라데이션 금지.

| 토큰 | 값 | 용도 |
|---|---|---|
| `--ink` | `#111111` | 본문, 다크 섹션 바탕 |
| `--paper` | `#FFFFFF` | 기본 바탕 |
| `--signal` | `#FF5A1F` | CTA·진행·현재 위치 (화면당 1~2곳) |
| `--sand` | `#F4F3F0` | 보조 면 |
| `--line` | `#E4E3DF` | 구분선 |
| `--mute` | `#6E6D69` | 보조 텍스트 (흰 바탕 대비 4.9:1) |
| 서체 | Pretendard (한글·본문), Archivo Condensed (영문 디스플레이) | |
| 반경 | 6 / 12 / 999 | 입력·카드·칩 |
| 간격 | 4px 기반 (4, 8, 12, 16, 24, 32, 48, 72) | |

그래픽 장치: 브랜드명의 콜론(`:`)을 오렌지 두 점으로 반복해 "재시작·진행"을 표현. 로고는 미확정이므로 텍스트 워드마크만 사용.

컴포넌트: `Header`, `BottomNav`, `Footer`, `Button`(primary/secondary/ghost), `Chip`, `StatusBadge`(Beta 준비 / Coming Soon / 초안 / 검수 전), `ModeCard`, `Stepper`, `ChoiceGroup`(단일/복수), `RoutineItem`, `ProgressBar`, `DayGrid`(7/30일), `GuideCard`, `Notice`(정보·주의), `ShareCardPreview`.

접근성: 모든 선택지는 실제 `button`/`input`, 포커스 링 표시, `prefers-reduced-motion` 존중, 한글 `word-break: keep-all`.

## D. 데이터 구조 / 규칙 엔진

로컬 저장 키 `reboot:v1` (localStorage, 서버 전송 없음)

```ts
Store {
  version: 1
  profile?: { mode, interests[], experience, minutes, concerns[], goal, nickname?, createdAt, updatedAt }
  routine?: { items: RoutineItem[], situation, createdAt, updatedAt }
  records: { [YYYY-MM-DD]: { planned: string[], done: string[] } }
  modeHistory: { mode, at }[]
}
RoutineItem { id, templateId, title, slot: 'am'|'pm', area, minutes, why, how, enabled, guide? }
```

- 엔진(`src/lib/engine.ts`)은 순수 함수. 템플릿(`src/lib/templates.ts`)마다 `modes / areas / concerns / situations / minMinutes` 조건과 `priority`를 갖고, 사용자가 고른 시간(3·5·10분) 예산 안에서 우선순위 순으로 채운다.
- 자외선 차단·세안·보습은 핵심 항목(core)으로 항상 포함.
- 완료율 = 완료 항목 / 그날 계획 항목. "외모 개선율" 같은 지표는 만들지 않는다.
- 체크 결과에 질환명·중증도·약물·시술·점수는 출력하지 않는다. 지속되는 증상은 "의료기관 상담" 안내만.

## E. 개발 순서와 테스트 기준

1. 토큰·레이아웃·내비게이션 → 2. 데이터/엔진 + 단위 테스트 → 3. 시작·체크·결과 → 4. 루틴 → 5. 기록·모드 전환·내보내기/삭제 → 6. 공유 카드 → 7. CARE 가이드 → 8. HOME → 9. CREW/SELECT/About/법적 안내 → 10. 빌드·모바일 점검

테스트 기준
- `npm run typecheck`, `npm run build` (정적 export) 통과
- 엔진 단위 테스트: 시간 예산 준수, 핵심 항목 포함, 모드별 상황 라벨, 진단 문구 미포함
- 390px 모바일·1280px 데스크톱에서 가로 스크롤 없음, 주요 흐름(시작→체크→루틴 체크→기록) 실제 클릭 테스트
- 공유 카드 PNG 생성 확인

## F. 1차 구현 범위와 미구현 범위

| 구분 | 항목 |
|---|---|
| **구현 (P0)** | HOME, 생활 모드 선택, 30초 체크, 룰 기반 루틴(편집·상황 전환), 로컬 기록 7/30일, 모드 전환 시 기록 보존, JSON/CSV 내보내기·전체 삭제, 공유 카드 9:16·4:5 PNG, CARE 가이드 10편 + 검색, CREW/SELECT 소개(준비 중), About, 협업 문의 안내, 법적 안내 초안 |
| **부분 구현** | 분석: `track()` 함수와 동의 구조만. 실제 분석 도구는 연결하지 않음 |
| **미구현 (P1~)** | 계정·기기 간 동기화, My Shelf, CREW Q&A·신고·모더레이션, 베타 대기 등록(이메일 수집 서버 없음), 30 DAYS 프로그램, SELECT 큐레이션·제휴 링크, PWA 설치·알림, 네이티브 앱 |
| **확인 필요** | 도메인·SNS 핸들, PX 실제 입점 상품, 의료 콘텐츠 전문가 검수, 이용약관·개인정보 처리방침 법률 검토, 운영자 공식 문의 이메일 |

확장 설계
- 모든 화면이 `useStore()` 한 곳에서 데이터를 읽으므로, 계정 도입 시 저장소 어댑터만 교체하면 된다 (`src/lib/store.ts`).
- 가이드는 `src/content/guides.ts` 데이터 파일 → 이후 MDX나 CMS로 이전 가능.
- 정적 export(`out/`)라 Vercel·Cloudflare Pages·GitHub Pages 어디든 올릴 수 있다. PWA는 manifest + service worker 추가로 확장.
