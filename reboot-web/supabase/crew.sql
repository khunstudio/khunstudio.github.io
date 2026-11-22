-- RE:BOOT CREW 스키마 (Supabase SQL Editor에 통째로 붙여 넣고 Run)
-- 구조: profiles(닉네임) · posts(ASK 질문 / PASS 경험) · answers(BACK) · helpful(도움 됨) · reports(신고) · blocks(차단)
-- 보안: 모든 테이블 RLS. 숨김(hidden) · 카운트는 사용자가 직접 못 바꾸고 트리거만 바꾼다.
-- 운영: 신고 3건이면 자동 숨김. 숨김 해제 · 삭제 · 신고 확인은 Supabase 대시보드 Table Editor에서 운영자가 한다.

create extension if not exists pgcrypto;
create schema if not exists private;

-- ── 테이블 ──
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nickname text not null unique check (char_length(nickname) between 2 and 16),
  created_at timestamptz not null default now()
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  kind text not null default 'ask' check (kind in ('ask', 'pass')),
  stage text not null check (stage in ('prepare', 'service', 'next', 'everyday')),
  topic text not null check (topic in ('skin', 'body', 'style', 'life', 'etc')),
  title text not null check (char_length(title) between 4 and 80),
  body text not null check (char_length(body) between 10 and 3000),
  solved boolean not null default false,
  hidden boolean not null default false,
  answer_count int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists posts_created_idx on public.posts (created_at desc);
create index if not exists posts_author_idx on public.posts (author);

create table if not exists public.answers (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  author uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 2 and 2000),
  hidden boolean not null default false,
  helpful_count int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists answers_post_idx on public.answers (post_id, created_at);
create index if not exists answers_author_idx on public.answers (author);

create table if not exists public.helpful (
  answer_id uuid not null references public.answers (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (answer_id, user_id)
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('post', 'answer')),
  target_id uuid not null,
  reporter uuid not null default auth.uid() references auth.users (id) on delete cascade,
  reason text not null check (char_length(reason) between 1 and 200),
  created_at timestamptz not null default now(),
  unique (target_type, target_id, reporter)
);

create table if not exists public.blocks (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, blocked_id)
);

-- ── 권한: 컬럼 단위로 좁힌다 (hidden · 카운트 · author는 사용자가 못 바꿈) ──
revoke all on public.profiles, public.posts, public.answers, public.helpful, public.reports, public.blocks from anon, authenticated;
grant select on public.profiles, public.posts, public.answers to anon, authenticated;
grant insert (id, nickname) on public.profiles to authenticated;
grant update (nickname) on public.profiles to authenticated;
grant insert (kind, stage, topic, title, body) on public.posts to authenticated;
grant update (title, body, solved) on public.posts to authenticated;
grant delete on public.posts to authenticated;
grant insert (post_id, body) on public.answers to authenticated;
grant update (body) on public.answers to authenticated;
grant delete on public.answers to authenticated;
grant select, insert (answer_id), delete on public.helpful to authenticated;
grant insert (target_type, target_id, reason) on public.reports to authenticated;
grant select, insert (blocked_id), delete on public.blocks to authenticated;

-- ── RLS ──
alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.answers enable row level security;
alter table public.helpful enable row level security;
alter table public.reports enable row level security;
alter table public.blocks enable row level security;

drop policy if exists "profiles read" on public.profiles;
create policy "profiles read" on public.profiles for select to anon, authenticated using (true);
drop policy if exists "profiles insert own" on public.profiles;
create policy "profiles insert own" on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

drop policy if exists "posts read visible" on public.posts;
create policy "posts read visible" on public.posts for select to anon, authenticated using (hidden = false or (select auth.uid()) = author);
drop policy if exists "posts insert own" on public.posts;
create policy "posts insert own" on public.posts for insert to authenticated with check ((select auth.uid()) = author);
drop policy if exists "posts update own" on public.posts;
create policy "posts update own" on public.posts for update to authenticated using ((select auth.uid()) = author) with check ((select auth.uid()) = author);
drop policy if exists "posts delete own" on public.posts;
create policy "posts delete own" on public.posts for delete to authenticated using ((select auth.uid()) = author);

drop policy if exists "answers read visible" on public.answers;
create policy "answers read visible" on public.answers for select to anon, authenticated using (hidden = false or (select auth.uid()) = author);
drop policy if exists "answers insert own" on public.answers;
create policy "answers insert own" on public.answers for insert to authenticated with check ((select auth.uid()) = author);
drop policy if exists "answers update own" on public.answers;
create policy "answers update own" on public.answers for update to authenticated using ((select auth.uid()) = author) with check ((select auth.uid()) = author);
drop policy if exists "answers delete own" on public.answers;
create policy "answers delete own" on public.answers for delete to authenticated using ((select auth.uid()) = author);

drop policy if exists "helpful own" on public.helpful;
create policy "helpful own" on public.helpful for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- 신고는 넣기만. 읽기는 대시보드(운영자)에서만
drop policy if exists "reports insert own" on public.reports;
create policy "reports insert own" on public.reports for insert to authenticated with check ((select auth.uid()) = reporter);

drop policy if exists "blocks own" on public.blocks;
create policy "blocks own" on public.blocks for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- ── 트리거 (private 스키마: Data API에 노출되지 않음) ──
-- 도배 방지: 10분에 글 3개, 답 10개
create or replace function private.rate_limit() returns trigger language plpgsql security invoker set search_path = '' as $$
declare n int;
begin
  if tg_table_name = 'posts' then
    select count(*) into n from public.posts where author = new.author and created_at > now() - interval '10 minutes';
    if n >= 3 then raise exception 'rate_limit' using hint = '잠시 후 다시 올려 주세요.'; end if;
  else
    select count(*) into n from public.answers where author = new.author and created_at > now() - interval '10 minutes';
    if n >= 10 then raise exception 'rate_limit' using hint = '잠시 후 다시 올려 주세요.'; end if;
  end if;
  return new;
end $$;

drop trigger if exists posts_rate on public.posts;
create trigger posts_rate before insert on public.posts for each row execute function private.rate_limit();
drop trigger if exists answers_rate on public.answers;
create trigger answers_rate before insert on public.answers for each row execute function private.rate_limit();

-- 카운트 · 자동 숨김은 다른 사람의 행을 고쳐야 해서 definer로 돌린다 (트리거 전용, 직접 호출 불가)
create or replace function private.answer_count() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then update public.posts set answer_count = answer_count + 1 where id = new.post_id;
  else update public.posts set answer_count = greatest(answer_count - 1, 0) where id = old.post_id; end if;
  return null;
end $$;
drop trigger if exists answers_count on public.answers;
create trigger answers_count after insert or delete on public.answers for each row execute function private.answer_count();

create or replace function private.helpful_count() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then update public.answers set helpful_count = helpful_count + 1 where id = new.answer_id;
  else update public.answers set helpful_count = greatest(helpful_count - 1, 0) where id = old.answer_id; end if;
  return null;
end $$;
drop trigger if exists helpful_count on public.helpful;
create trigger helpful_count after insert or delete on public.helpful for each row execute function private.helpful_count();

create or replace function private.auto_hide() returns trigger language plpgsql security definer set search_path = '' as $$
declare n int;
begin
  select count(*) into n from public.reports where target_type = new.target_type and target_id = new.target_id;
  if n >= 3 then
    if new.target_type = 'post' then update public.posts set hidden = true where id = new.target_id;
    else update public.answers set hidden = true where id = new.target_id; end if;
  end if;
  return null;
end $$;
drop trigger if exists reports_hide on public.reports;
create trigger reports_hide after insert on public.reports for each row execute function private.auto_hide();

revoke all on all functions in schema private from public, anon, authenticated;
