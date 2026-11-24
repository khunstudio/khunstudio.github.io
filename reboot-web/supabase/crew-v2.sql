-- RE:BOOT CREW v2: 글 · 답 수정 표시, 사진 첨부 (crew.sql을 먼저 실행한 뒤 한 번 실행)
-- 여러 번 실행해도 안전하게 만들었다.

-- ── 수정 시각 · 사진 ──
alter table public.posts add column if not exists edited_at timestamptz;
alter table public.answers add column if not exists edited_at timestamptz;
alter table public.posts add column if not exists images text[] not null default '{}';
alter table public.posts drop constraint if exists posts_images_max;
alter table public.posts add constraint posts_images_max check (cardinality(images) <= 4);

-- 사진은 내 폴더(사용자 id/...)에 올린 파일만 글에 붙일 수 있게
create or replace function private.check_post_images() returns trigger language plpgsql security invoker set search_path = '' as $$
declare p text;
begin
  foreach p in array coalesce(new.images, '{}') loop
    if p !~ ('^' || new.author::text || '/[A-Za-z0-9_-]+\.(webp|jpg|jpeg|png)$') then
      raise exception 'bad_image_path';
    end if;
  end loop;
  return new;
end $$;
drop trigger if exists posts_images_check on public.posts;
create trigger posts_images_check before insert or update of images on public.posts for each row execute function private.check_post_images();

-- 제목 · 본문이 바뀌면 수정 시각을 남긴다 (사용자가 직접 못 바꾼다)
create or replace function private.mark_edited() returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if tg_table_name = 'posts' then
    if new.title is distinct from old.title or new.body is distinct from old.body or new.images is distinct from old.images then new.edited_at := now(); end if;
  elsif new.body is distinct from old.body then
    new.edited_at := now();
  end if;
  return new;
end $$;
drop trigger if exists posts_edited on public.posts;
create trigger posts_edited before update on public.posts for each row execute function private.mark_edited();
drop trigger if exists answers_edited on public.answers;
create trigger answers_edited before update on public.answers for each row execute function private.mark_edited();

grant insert (kind, stage, topic, title, body, images) on public.posts to authenticated;
grant update (title, body, solved, images) on public.posts to authenticated;
revoke all on all functions in schema private from public, anon, authenticated;

-- ── 사진 저장소 (Storage) ──
-- 공개 읽기 버킷. 5MB 이하 이미지만. 사이트에서 올리기 전에 1600px webp로 줄이고 위치 정보(EXIF)를 지운다.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('crew', 'crew', true, 5242880, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "crew upload own folder" on storage.objects;
create policy "crew upload own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'crew' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "crew delete own files" on storage.objects;
create policy "crew delete own files" on storage.objects for delete to authenticated
  using (bucket_id = 'crew' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- 삭제 · 교체할 때 내 파일을 찾을 수 있게 (공개 버킷이라 다른 사람 파일은 URL로만 보인다)
drop policy if exists "crew read own files" on storage.objects;
create policy "crew read own files" on storage.objects for select to authenticated
  using (bucket_id = 'crew' and (storage.foldername(name))[1] = (select auth.uid())::text);
