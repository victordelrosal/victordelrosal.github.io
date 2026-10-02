-- victordelrosal.com moves to the one fiveinnolabs account (2 Oct 2026, /federated-access).
-- Sign-in is Firebase (project ai-badge-2026), registered on flux as a third-party auth issuer.
-- Firebase tokens carry no `role` claim, so they arrive as `anon`, and their uid is not a uuid, so
-- auth.uid() would throw on them: nothing here calls it. Every signed-in write goes through the
-- SECURITY DEFINER functions below, which identify the caller with fil_uid(). Supabase Auth itself stays
-- on for the other apps on flux; only this site's tables change.
-- Backups of the rows, policies and functions taken first: supabase/backups/*-2026-10-02.json (not committed).

-- 1. the person on this site is their Firebase uid
alter table public.comment_users add column if not exists fb_uid text unique;
alter table public.comment_users alter column auth_id drop not null;

-- 2. who is calling: a Firebase ID token from ai-badge-2026, or nobody
create or replace function public.fil_uid() returns text
language sql stable set search_path = '' as $$
  select case
    when auth.jwt() ->> 'iss' = 'https://securetoken.google.com/ai-badge-2026'
     and auth.jwt() ->> 'aud' = 'ai-badge-2026'
     and coalesce(auth.jwt() ->> 'sub', '') <> ''
    then auth.jwt() ->> 'sub' end
$$;

-- 3. the caller's profile: found by uid; else a pre-federation profile with the same VERIFIED email is claimed
--    once (same verified email = same person); else created. Name and photo follow the account.
create or replace function public.fil_me() returns public.comment_users
language plpgsql security definer set search_path = public as $$
declare
  uid text := public.fil_uid();
  j jsonb := auth.jwt();
  em text := lower(nullif(btrim(auth.jwt() ->> 'email'), ''));
  r public.comment_users;
begin
  if uid is null then raise exception 'not signed in' using errcode = '28000'; end if;
  select * into r from comment_users where fb_uid = uid;
  if not found and em is not null and (j ->> 'email_verified') = 'true' then
    update comment_users set fb_uid = uid
     where id = (select id from comment_users where lower(email) = em and fb_uid is null order by created_at limit 1)
    returning * into r;
  end if;
  if r.id is null then
    insert into comment_users (fb_uid, email, display_name, avatar_url)
    values (uid, coalesce(em, ''), coalesce(nullif(btrim(j ->> 'name'), ''), split_part(coalesce(em, 'Reader'), '@', 1)),
            nullif(j ->> 'picture', ''))
    returning * into r;
  elsif coalesce(nullif(btrim(j ->> 'name'), ''), r.display_name) is distinct from r.display_name
     or coalesce(nullif(j ->> 'picture', ''), r.avatar_url) is distinct from r.avatar_url then
    update comment_users
       set display_name = coalesce(nullif(btrim(j ->> 'name'), ''), display_name),
           avatar_url = coalesce(nullif(j ->> 'picture', ''), avatar_url), updated_at = now()
     where id = r.id returning * into r;
  end if;
  return r;
end $$;

-- 4. post a comment or a reply (10 per 10 minutes per person)
create or replace function public.fil_post_comment(p_slug text, p_content text, p_parent uuid default null)
returns public.comments
language plpgsql security definer set search_path = public as $$
declare
  me public.comment_users := public.fil_me();
  t text := btrim(coalesce(p_content, ''));
  c public.comments;
begin
  if t = '' or char_length(t) > 2000 then raise exception 'A comment is 1 to 2000 characters'; end if;
  if p_slug is null or p_slug !~ '^[A-Za-z0-9_-]{1,200}$' then raise exception 'Unknown post'; end if;
  if p_parent is not null and not exists (select 1 from comments where id = p_parent and post_slug = p_slug and not is_deleted) then
    raise exception 'That comment is no longer there';
  end if;
  if (select count(*) from comments where user_id = me.id and created_at > now() - interval '10 minutes') >= 10 then
    raise exception 'Too many comments in a short time. Try again in a few minutes.';
  end if;
  insert into comments (post_slug, user_id, content, parent_id) values (p_slug, me.id, t, p_parent) returning * into c;
  return c;
end $$;

-- 5. soft-delete: the author, or an admin
create or replace function public.fil_delete_comment(p_id uuid) returns boolean
language plpgsql security definer set search_path = public as $$
declare me public.comment_users := public.fil_me();
begin
  update comments set is_deleted = true, updated_at = now()
   where id = p_id and (user_id = me.id or me.is_admin is true);
  return found;
end $$;

-- 6. email preferences
create or replace function public.fil_update_profile(p_subscribed boolean default null, p_timezone text default null)
returns public.comment_users
language plpgsql security definer set search_path = public as $$
declare me public.comment_users := public.fil_me();
begin
  if p_timezone is not null and p_timezone !~ '^[A-Za-z0-9_+/-]{1,64}$' then raise exception 'Unknown timezone'; end if;
  update comment_users set is_subscribed = coalesce(p_subscribed, is_subscribed), timezone = coalesce(p_timezone, timezone),
         updated_at = now()
   where id = me.id returning * into me;
  return me;
end $$;

-- 7. delete this site's data about the caller (profile and comments); the fiveinnolabs account itself stays
create or replace function public.fil_delete_my_data() returns boolean
language plpgsql security definer set search_path = public as $$
declare uid text := public.fil_uid();
begin
  if uid is null then raise exception 'not signed in' using errcode = '28000'; end if;
  delete from comment_users where fb_uid = uid;
  return found;
end $$;

-- 8. for the XP broker (aireckon.ing): is this live comment by this uid? Returns its post and length, or nothing.
create or replace function public.fil_comment_check(p_id uuid, p_uid text)
returns table (post_slug text, chars integer)
language sql stable security definer set search_path = public as $$
  select c.post_slug, char_length(c.content)
    from comments c join comment_users u on u.id = c.user_id
   where c.id = p_id and not c.is_deleted and u.fb_uid = p_uid
$$;

revoke all on function public.fil_me(), public.fil_post_comment(text, text, uuid), public.fil_delete_comment(uuid),
  public.fil_update_profile(boolean, text), public.fil_delete_my_data(), public.fil_comment_check(uuid, text) from public;
grant execute on function public.fil_me(), public.fil_post_comment(text, text, uuid), public.fil_delete_comment(uuid),
  public.fil_update_profile(boolean, text), public.fil_delete_my_data(), public.fil_comment_check(uuid, text) to anon, authenticated;

-- 9. writes only through the functions above; profiles (with emails) no longer readable by the public
drop policy if exists "Authenticated users can insert comments" on public.comments;
drop policy if exists "Users can delete own comments" on public.comments;
drop policy if exists "Users can update own comments or admin can soft-delete" on public.comments;
drop policy if exists "Users can insert their own profile" on public.comment_users;
drop policy if exists "Users can update their own profile" on public.comment_users;
drop policy if exists "Public can read comment users" on public.comment_users;
