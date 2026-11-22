-- Run once in the intended Supabase project. No project is provisioned by this file.
begin;
create table if not exists public.study_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null check (jsonb_typeof(payload)='object' and octet_length(payload::text)<5242880),
  revision bigint not null default 1,
  updated_at timestamptz not null default now()
);
alter table public.study_state enable row level security;
revoke all on public.study_state from anon, authenticated;
grant select,insert,update,delete on public.study_state to authenticated;
create policy own_state_select on public.study_state for select to authenticated using ((select auth.uid())=user_id);
create policy own_state_insert on public.study_state for insert to authenticated with check ((select auth.uid())=user_id);
create policy own_state_update on public.study_state for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy own_state_delete on public.study_state for delete to authenticated using ((select auth.uid())=user_id);

create or replace function public.save_study_state(expected_revision bigint,payload_input jsonb)
returns table(revision bigint, conflict boolean)
language plpgsql security invoker set search_path='' as $$
declare current_id uuid:=auth.uid(); next_revision bigint;
begin
  if current_id is null then raise exception 'Authentication required'; end if;
  if expected_revision=0 then
    insert into public.study_state(user_id,payload,revision) values(current_id,payload_input,1)
      on conflict(user_id) do nothing returning study_state.revision into next_revision;
  else
    update public.study_state set payload=payload_input,revision=study_state.revision+1,updated_at=now()
      where user_id=current_id and study_state.revision=expected_revision returning study_state.revision into next_revision;
  end if;
  return query select next_revision,next_revision is null;
end $$;
revoke all on function public.save_study_state(bigint,jsonb) from public,anon;
grant execute on function public.save_study_state(bigint,jsonb) to authenticated;

create table if not exists public.editor_roles (
  user_id uuid references auth.users(id) on delete cascade,
  role text check(role in ('editor','reviewer')) not null,
  primary key(user_id,role)
);
alter table public.editor_roles enable row level security;
revoke all on public.editor_roles from anon,authenticated;
grant select on public.editor_roles to authenticated;
create policy own_role_read on public.editor_roles for select to authenticated using((select auth.uid())=user_id);
-- Assign roles only through the trusted database administration interface.

create table if not exists public.corrections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  route text not null check(length(route)<300),
  title text not null check(length(title)<500),
  text text not null check(length(text)<10001),
  status text not null default 'submitted' check(status in ('submitted','investigating','needs-source','ready-for-review','reviewed','closed')),
  review_note text not null default '' check(length(review_note)<20001),
  created_at timestamptz not null default now()
);
alter table public.corrections enable row level security;
revoke all on public.corrections from anon,authenticated;
grant select,insert on public.corrections to authenticated;
grant update(status,review_note) on public.corrections to authenticated;
create policy correction_read on public.corrections for select to authenticated using (
  (select auth.uid())=user_id or exists(select 1 from public.editor_roles where user_id=(select auth.uid()) and role in ('editor','reviewer'))
);
create policy correction_submit on public.corrections for insert to authenticated with check (
  user_id=(select auth.uid()) and status='submitted' and review_note=''
);
create policy correction_edit on public.corrections for update to authenticated using (
  exists(select 1 from public.editor_roles where user_id=(select auth.uid()) and role in ('editor','reviewer'))
) with check (
  exists(select 1 from public.editor_roles where user_id=(select auth.uid()) and role in ('editor','reviewer'))
  and (status<>'reviewed' or exists(select 1 from public.editor_roles where user_id=(select auth.uid()) and role='reviewer'))
);

-- Narrowly scoped deletion. No arbitrary user ID is accepted.
create or replace function public.delete_own_account() returns void
language plpgsql security definer set search_path='' as $$
declare current_id uuid:=auth.uid();
begin
  if current_id is null then raise exception 'Authentication required'; end if;
  delete from auth.users where id=current_id;
end $$;
revoke all on function public.delete_own_account() from public,anon;
grant execute on function public.delete_own_account() to authenticated;
commit;
