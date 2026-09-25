create table if not exists public.trainer_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  settings jsonb not null default '{}'::jsonb,
  reviews jsonb not null default '{}'::jsonb,
  content_version text not null default '',
  last_saved_at timestamptz not null default now(),
  revision bigint not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.trainer_sessions (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table if not exists public.trainer_attempts (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  session_id text not null,
  payload jsonb not null,
  completed_at timestamptz not null default now(),
  primary key (user_id, id)
);

alter table public.trainer_profiles enable row level security;
alter table public.trainer_sessions enable row level security;
alter table public.trainer_attempts enable row level security;
alter table public.trainer_profiles force row level security;
alter table public.trainer_sessions force row level security;
alter table public.trainer_attempts force row level security;

revoke all on public.trainer_profiles from anon, authenticated;
revoke all on public.trainer_sessions from anon, authenticated;
revoke all on public.trainer_attempts from anon, authenticated;
grant select on public.trainer_profiles to authenticated;
grant select on public.trainer_sessions to authenticated;
grant select on public.trainer_attempts to authenticated;

drop policy if exists trainer_profiles_select on public.trainer_profiles;
drop policy if exists trainer_sessions_select on public.trainer_sessions;
drop policy if exists trainer_attempts_select on public.trainer_attempts;

create policy trainer_profiles_select
  on public.trainer_profiles
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy trainer_sessions_select
  on public.trainer_sessions
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy trainer_attempts_select
  on public.trainer_attempts
  for select
  to authenticated
  using (auth.uid() = user_id);

create or replace function public.sync_trainer_state(
  p_state jsonb,
  p_expected_revision bigint
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_revision bigint;
begin
  if v_user is null then
    raise exception 'authentication required';
  end if;

  insert into public.trainer_profiles (
    user_id,
    settings,
    reviews,
    content_version,
    last_saved_at,
    revision
  )
  values (
    v_user,
    coalesce(p_state->'settings', '{}'::jsonb),
    coalesce(p_state->'reviews', '{}'::jsonb),
    coalesce(p_state->>'version', ''),
    coalesce(nullif(p_state->>'lastSavedAt', '')::timestamptz, now())
  )
  on conflict (user_id) do nothing;

  select revision
    into v_revision
    from public.trainer_profiles
   where user_id = v_user
   for update;

  if v_revision <> coalesce(p_expected_revision, 0) then
    return jsonb_build_object('conflict', true, 'revision', v_revision);
  end if;

  delete from public.trainer_sessions where user_id = v_user;
  delete from public.trainer_attempts where user_id = v_user;

  insert into public.trainer_sessions (
    user_id,
    id,
    payload,
    created_at,
    updated_at
  )
  select
    v_user,
    item->>'id',
    item,
    coalesce(nullif(item->>'createdAt', '')::timestamptz, now()),
    coalesce(
      nullif(item->>'completedAt', '')::timestamptz,
      nullif(item->>'startedAt', '')::timestamptz,
      now()
    )
  from jsonb_array_elements(coalesce(p_state->'sessions', '[]'::jsonb)) as item
  where item->>'id' is not null;

  insert into public.trainer_attempts (
    user_id,
    id,
    session_id,
    payload,
    completed_at
  )
  select
    v_user,
    item->>'id',
    coalesce(nullif(item->>'sessionId', ''), ''),
    item,
    coalesce(nullif(item->>'completedAt', '')::timestamptz, now())
  from jsonb_array_elements(coalesce(p_state->'attempts', '[]'::jsonb)) as item
  where item->>'id' is not null;

  update public.trainer_profiles
     set settings = coalesce(p_state->'settings', '{}'::jsonb),
         reviews = coalesce(p_state->'reviews', '{}'::jsonb),
         content_version = coalesce(p_state->>'version', ''),
         last_saved_at = coalesce(nullif(p_state->>'lastSavedAt', '')::timestamptz, now()),
         revision = v_revision + 1,
         updated_at = now()
   where user_id = v_user;

  return jsonb_build_object('conflict', false, 'revision', v_revision + 1);
end;
$$;

revoke all on function public.sync_trainer_state(jsonb, bigint) from public, anon;
grant execute on function public.sync_trainer_state(jsonb, bigint) to authenticated;
