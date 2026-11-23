// CREW(Supabase) 연결 정보. 둘 다 원래 브라우저에 공개되는 값이라 코드에 둬도 안전해요.
// 권한은 DB의 RLS가 지켜요 (supabase/crew.sql). secret / service_role 키는 절대 여기에 넣지 않아요.
// 호스팅 환경 변수(NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)가 있으면 그걸 먼저 써요.
export const CREW_SUPABASE_URL = "";
export const CREW_SUPABASE_PUBLISHABLE_KEY = "";

export const crewOpen = Boolean((process.env.NEXT_PUBLIC_SUPABASE_URL || CREW_SUPABASE_URL) && (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || CREW_SUPABASE_PUBLISHABLE_KEY));
