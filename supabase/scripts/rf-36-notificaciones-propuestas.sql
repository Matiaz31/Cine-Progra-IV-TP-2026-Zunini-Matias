-- RF-36: notificaciones persistentes por resolución de propuestas de películas.
-- Ejecutar una sola vez en Supabase SQL Editor.
-- La notificación se genera en la misma transacción que la resolución.

begin;

alter table public.notifications
  add column if not exists proposal_id uuid,
  add column if not exists message text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'notifications_proposal_id_fkey'
      and conrelid = 'public.notifications'::regclass
  ) then
    alter table public.notifications
      add constraint notifications_proposal_id_fkey
      foreign key (proposal_id)
      references public.movie_proposals(id)
      on delete set null;
  end if;
end;
$$;

create index if not exists idx_notifications_user_created_at
  on public.notifications (user_id, created_at desc);

create unique index if not exists idx_notifications_proposal_resolution
  on public.notifications (proposal_id)
  where proposal_id is not null
    and type in ('movie_proposal_accepted', 'movie_proposal_rejected');

create schema if not exists private authorization postgres;
revoke all on schema private from public, anon, authenticated;

create or replace function private.notify_movie_proposal_resolution()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if old.status = 'pending'
     and new.status in ('accepted', 'rejected') then
    insert into public.notifications (
      user_id,
      proposal_id,
      type,
      message,
      created_at
    )
    values (
      new.user_id,
      new.id,
      case
        when new.status = 'accepted' then 'movie_proposal_accepted'
        else 'movie_proposal_rejected'
      end,
      case
        when new.status = 'accepted'
          then format('Tu propuesta "%s" fue aceptada.', new.title)
        else format('Tu propuesta "%s" fue rechazada.', new.title)
      end,
      coalesce(new.reviewed_at, now())
    )
    on conflict (proposal_id)
      where proposal_id is not null
        and type in ('movie_proposal_accepted', 'movie_proposal_rejected')
      do nothing;

    insert into public.activity_logs (
      user_id,
      action,
      entity_type,
      entity_id,
      details,
      created_at
    )
    values (
      new.reviewed_by,
      'update',
      'movie_proposal',
      new.id,
      jsonb_build_object(
        'title', new.title,
        'previous_status', old.status,
        'new_status', new.status,
        'review_comment', new.review_comment
      ),
      coalesce(new.reviewed_at, now())
    );
  end if;

  return new;
end;
$$;

revoke all on function private.notify_movie_proposal_resolution()
  from public, anon, authenticated;

drop trigger if exists trg_notify_movie_proposal_resolution
  on public.movie_proposals;

create trigger trg_notify_movie_proposal_resolution
after update of status on public.movie_proposals
for each row
when (old.status is distinct from new.status)
execute function private.notify_movie_proposal_resolution();

-- Recupera también las propuestas que ya estaban resueltas antes de instalar el trigger.
insert into public.notifications (
  user_id,
  proposal_id,
  type,
  message,
  created_at
)
select
  p.user_id,
  p.id,
  case
    when p.status = 'accepted' then 'movie_proposal_accepted'
    else 'movie_proposal_rejected'
  end,
  case
    when p.status = 'accepted'
      then format('Tu propuesta "%s" fue aceptada.', p.title)
    else format('Tu propuesta "%s" fue rechazada.', p.title)
  end,
  coalesce(p.reviewed_at, p.updated_at, p.created_at)
from public.movie_proposals p
where p.status in ('accepted', 'rejected')
on conflict (proposal_id)
  where proposal_id is not null
    and type in ('movie_proposal_accepted', 'movie_proposal_rejected')
  do nothing;

-- Registra también las resoluciones previas que todavía no tengan auditoría.
insert into public.activity_logs (
  user_id,
  action,
  entity_type,
  entity_id,
  details,
  created_at
)
select
  p.reviewed_by,
  'update',
  'movie_proposal',
  p.id,
  jsonb_build_object(
    'title', p.title,
    'previous_status', 'pending',
    'new_status', p.status,
    'review_comment', p.review_comment
  ),
  coalesce(p.reviewed_at, p.updated_at, p.created_at)
from public.movie_proposals p
where p.status in ('accepted', 'rejected')
  and not exists (
    select 1
    from public.activity_logs l
    where l.entity_type = 'movie_proposal'
      and l.entity_id = p.id
      and l.action = 'update'
  );

commit;
