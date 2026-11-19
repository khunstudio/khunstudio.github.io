# RE:BOOT Web (MVP · Prototype)

남성 자기관리 웹 서비스 RE:BOOT의 1차 웹 MVP. 기준 문서: RE:BOOT BRAND, BUSINESS & PRODUCT MASTER PLAN v3.0 (2026-11-19).
검증한 구현 상태, 출시 우선순위, 변경 내역은 [`PROJECT_STATE.md`](PROJECT_STATE.md)를 우선 참고한다.
설계 정리(IA · 흐름 · 디자인 토큰 · 데이터 구조 · 범위)는 [`docs/MVP_PLAN.md`](docs/MVP_PLAN.md).

## 실행

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # 루틴 엔진 단위 테스트
npm run typecheck
npm run build      # 정적 사이트 → out/
```

## 배포

`npm run build` 결과물 `out/` 폴더를 그대로 올리면 된다 (Vercel · Cloudflare Pages · GitHub Pages).
하위 경로에 올릴 때는 `NEXT_PUBLIC_BASE_PATH=/경로 npm run build`.
기존 배포: Vercel 프로젝트 `reboot`. 사용자가 안내한 주소는 https://rebootyourself.vercel.app 이며,
실제 브라우저로 확인한 기존 주소는 https://reboot-psi.vercel.app/ 이다. 이번 변경의 배포 결과는 `PROJECT_STATE.md`에 기록한다.
현재 프로토타입은 검색 색인 제외(`noindex`)를 유지한다.

## 구조

```
src/app/            페이지 (App Router, 정적 export)
src/components/     공통 UI
src/lib/engine.ts   규칙 기반 루틴 엔진 (순수 함수)
src/lib/templates.ts 루틴 항목 템플릿
src/lib/store.ts    로컬 저장 어댑터 (계정 도입 시 교체 지점)
src/content/guides.ts CARE 가이드 콘텐츠
tests/              엔진 테스트
```
