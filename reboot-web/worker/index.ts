// RE:BOOT Cloudflare Worker
// - 사이트: 정적 파일(out/)은 Cloudflare가 바로 내보내고, 나머지 요청도 정적 자산으로 넘긴다(404 페이지 포함).
// - 예약 작업: Supabase 무료 플랜은 7일 동안 요청이 없으면 일시정지되므로 5일마다 한 번 가볍게 조회해 깨워 둔다.
//   URL과 publishable 키는 원래 공개되는 값이다 (src/lib/crew-config.ts와 같음).

const SUPABASE_URL = "https://uxbqrlbtxwmrzjbdflry.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_4HiL4psU13eNGF0BtDkItg_xjJkvVmS";

interface Env { ASSETS: { fetch: (req: Request) => Promise<Response> } }

export default {
  fetch(request: Request, env: Env): Promise<Response> {
    return env.ASSETS.fetch(request);
  },
  async scheduled(_event: unknown, _env: Env, ctx: { waitUntil: (p: Promise<unknown>) => void }) {
    ctx.waitUntil(
      fetch(`${SUPABASE_URL}/rest/v1/posts?select=id&limit=1`, { headers: { apikey: SUPABASE_PUBLISHABLE_KEY } })
        .then((r) => console.log(`[keep-alive] supabase ${r.status}`))
        .catch((e) => console.log(`[keep-alive] failed ${e}`)),
    );
  },
};
