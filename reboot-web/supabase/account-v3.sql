-- RE:BOOT 계정 v3: MY 기록 백업 · 동기화 (crew.sql, crew-v2.sql 다음에 한 번 실행)
-- 사용자가 MY에서 '계정에 백업'을 켰을 때만 저장된다. 한 사람당 한 줄(루틴 · 기록 · 목표 전체 JSON).

create table if not exists public.user_data (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  data jsonb not null check (pg_column_size(data) < 1048576),
  updated_at timestamptz not null default now()
);

create or replace function private.touch_updated_at() returns trigger language plpgsql security invoker set search_path = '' as $$
begin new.updated_at := now(); return new; end $$;
drop trigger if exists user_data_touch on public.user_data;
create trigger user_data_touch before update on public.user_data for each row execute function private.touch_updated_at();

revoke all on public.user_data from anon, authenticated;
grant select, insert (data), update (data), delete on public.user_data to authenticated;
revoke all on all functions in schema private from public, anon, authenticated;

alter table public.user_data enable row level security;
drop policy if exists "user_data own" on public.user_data;
create policy "user_data own" on public.user_data for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
