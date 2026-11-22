-- Apply after supabase.sql. Safe to reapply; no service or mailing list is created.
begin;
create table if not exists public.email_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  subscribed boolean not null default false,
  email_at_consent text,
  consent_version text not null,
  consent_text text not null,
  consented_at timestamptz,
  withdrawn_at timestamptz,
  updated_at timestamptz not null default now()
);
create table if not exists public.email_consent_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subscribed boolean not null,
  email_at_consent text,
  consent_version text not null,
  consent_text text not null,
  source text not null check(source in ('signup','account')),
  recorded_at timestamptz not null default now()
);
alter table public.email_preferences enable row level security;
alter table public.email_consent_events enable row level security;
revoke all on public.email_preferences, public.email_consent_events from public, anon, authenticated;
grant select on public.email_preferences, public.email_consent_events to authenticated;
drop policy if exists own_email_preference_read on public.email_preferences;
create policy own_email_preference_read on public.email_preferences for select to authenticated using((select auth.uid())=user_id);
drop policy if exists own_email_consent_read on public.email_consent_events;
create policy own_email_consent_read on public.email_consent_events for select to authenticated using((select auth.uid())=user_id);

-- No caller-supplied user ID, email, consent timestamp, or arbitrary consent text.
-- This function alone can write these tables; readers can only view their own rows.
create or replace function public.set_email_preference(subscribed_input boolean,consent_version_input text,source_input text default 'account')
returns setof public.email_preferences
language plpgsql security definer set search_path='' as $$
declare
  current_id uuid:=auth.uid();
  verified_email text;
  checked_version text:=consent_version_input;
  checked_text text;
begin
  if current_id is null then raise exception 'Authentication required'; end if;
  if subscribed_input is null or consent_version_input is null or consent_version_input not in ('updates-v1','updates-v2') or source_input is null or source_input not in ('signup','account') then
    raise exception 'Unsupported email preference';
  end if;
  -- Versioned wording preserves old signup intents and all existing history.
  checked_text:=case checked_version
    when 'updates-v1' then 'Email me occasional updates about The Orthodox Way. Optional; you can change this preference anytime.'
    when 'updates-v2' then 'Email me occasional updates about Holy Apostolic. Optional; you can change this preference anytime.'
  end;
  select email into verified_email from auth.users where id=current_id and email_confirmed_at is not null;
  if subscribed_input and (verified_email is null or verified_email='') then raise exception 'Verify your account email before subscribing'; end if;
  insert into public.email_preferences(user_id,subscribed,email_at_consent,consent_version,consent_text,consented_at,withdrawn_at,updated_at)
  values(current_id,subscribed_input,verified_email,checked_version,checked_text,case when subscribed_input then now() end,case when not subscribed_input then now() end,now())
  on conflict(user_id) do update set subscribed=excluded.subscribed,email_at_consent=excluded.email_at_consent,
    consent_version=excluded.consent_version,consent_text=excluded.consent_text,
    consented_at=case when excluded.subscribed then now() else email_preferences.consented_at end,
    withdrawn_at=case when not excluded.subscribed then now() else null end,updated_at=now();
  insert into public.email_consent_events(user_id,subscribed,email_at_consent,consent_version,consent_text,source)
  values(current_id,subscribed_input,verified_email,checked_version,checked_text,source_input);
  return query select * from public.email_preferences where user_id=current_id;
end $$;
revoke all on function public.set_email_preference(boolean,text,text) from public,anon;
grant execute on function public.set_email_preference(boolean,text,text) to authenticated;
commit;
