-- RE:BOOT 계정 v4: 앱 안에서 바로 계정 삭제 (App Store 필수 요건)
-- 로그인한 본인 계정만 지운다. 계정이 지워지면 닉네임 · 글 · 답 · 도움 됨 · 신고 · 차단 · MY 백업이 연결(cascade)로 함께 지워진다.
-- 첨부 사진 파일은 사이트가 이 함수를 부르기 전에 저장소에서 먼저 지운다.

create or replace function public.delete_my_account() returns void
language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'not_authenticated'; end if;
  delete from auth.users where id = uid;
end $$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

-- ── 협업 문의 (누구나 보낼 수 있고, 읽기는 대시보드에서 운영자만) ──
create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('brand', 'expert', 'content', 'press', 'etc')),
  org text check (char_length(org) <= 80),
  name text not null check (char_length(name) between 1 and 40),
  email text not null check (char_length(email) between 5 and 120 and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  message text not null check (char_length(message) between 10 and 3000),
  created_at timestamptz not null default now()
);
revoke all on public.inquiries from anon, authenticated;
grant insert (kind, org, name, email, message) on public.inquiries to anon, authenticated;
alter table public.inquiries enable row level security;
drop policy if exists "inquiries insert" on public.inquiries;
create policy "inquiries insert" on public.inquiries for insert to anon, authenticated with check (true);

-- 도배 방지: 전체 기준 1분에 5건까지
create or replace function private.inquiry_rate() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if (select count(*) from public.inquiries where created_at > now() - interval '1 minute') >= 5 then
    raise exception 'rate_limit';
  end if;
  return new;
end $$;
drop trigger if exists inquiries_rate on public.inquiries;
create trigger inquiries_rate before insert on public.inquiries for each row execute function private.inquiry_rate();
revoke all on all functions in schema private from public, anon, authenticated;
