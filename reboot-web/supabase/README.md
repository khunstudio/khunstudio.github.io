# CREW 연결 방법 (Supabase)

1. https://supabase.com 에서 New project. Region은 Northeast Asia (Seoul).
2. 왼쪽 SQL Editor → `crew.sql` 내용을 통째로 붙여 넣고 Run.
3. Authentication → URL Configuration
   - Site URL: `https://rebootyourself.vercel.app`
   - Redirect URLs에 추가: `https://rebootyourself.vercel.app/crew/login/`, `https://reboot-psi.vercel.app/crew/login/`
4. Project Settings → API Keys에서 두 값을 복사
   - Project URL
   - Publishable key (`sb_publishable_...`). secret / service_role 키는 절대 쓰지 않아요.
5. Vercel → reboot 프로젝트 → Settings → Environment Variables
   - `NEXT_PUBLIC_SUPABASE_URL` = Project URL
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` = Publishable key
6. 다시 배포하면 CREW가 열려요.

## 운영
- 신고 3건이면 글 · 답이 자동으로 가려져요 (`hidden = true`).
- 신고 확인: Table Editor → `reports`
- 숨김 해제 / 삭제: Table Editor → `posts` 또는 `answers`에서 `hidden` 값을 바꾸거나 행 삭제
- 계정 삭제 요청: Authentication → Users에서 사용자 삭제 (글 · 답도 함께 지워져요)
- 기본 메일 발송은 시간당 몇 통으로 제한돼요. 사용자가 늘면 Authentication → SMTP에 메일 서비스를 연결하세요.
