-- Serializa las asignaciones automáticas y valida disponibilidad en la base.
create or replace function public.create_screening_auto_room(
  p_movie_id uuid, p_start_time timestamptz, p_end_time timestamptz,
  p_format text, p_language text, p_price numeric
)
returns table(screening_id uuid, room_id uuid, room_name text)
language plpgsql security definer set search_path = ''
as $$
declare v_room public.rooms%rowtype; v_screening_id uuid;
begin
  if auth.uid() is null or not public.has_admin_permission('screenings', 'create') then
    raise exception 'No tenés permisos para crear funciones.';
  end if;
  if p_end_time <= p_start_time then raise exception 'La hora de finalización debe ser posterior al inicio.'; end if;
  perform pg_advisory_xact_lock(734821905);
  for v_room in
    select r.* from public.rooms r
    where r.is_active = true and not exists (
      select 1 from public.screenings s
      where s.room_id = r.id and s.status = 'scheduled'
        and p_start_time < s.end_time + interval '30 minutes'
        and p_end_time > s.start_time - interval '30 minutes'
    ) order by r.name
  loop
    begin
      insert into public.screenings(movie_id,room_id,start_time,end_time,format,language,price,status)
      values(p_movie_id,v_room.id,p_start_time,p_end_time,p_format,p_language,p_price,'scheduled')
      returning id into v_screening_id;
      return query select v_screening_id,v_room.id,v_room.name;
      return;
    exception when raise_exception then
      v_screening_id := null;
    end;
  end loop;
  raise exception 'No hay una sala disponible para ese horario. Deben existir al menos 30 minutos entre funciones de la misma sala.';
end;
$$;
revoke all on function public.create_screening_auto_room(uuid,timestamptz,timestamptz,text,text,numeric) from public,anon;
grant execute on function public.create_screening_auto_room(uuid,timestamptz,timestamptz,text,text,numeric) to authenticated;

create or replace function public.check_screening_time()
returns trigger language plpgsql set search_path = ''
as $$
begin
  perform pg_advisory_xact_lock(hashtextextended(new.room_id::text,0));
  if new.status = 'scheduled' and exists (
    select 1 from public.screenings s
    where s.room_id=new.room_id and s.id<>coalesce(new.id,gen_random_uuid())
      and s.status='scheduled'
      and new.start_time < s.end_time + interval '30 minutes'
      and new.end_time > s.start_time - interval '30 minutes'
  ) then
    raise exception 'La sala ya tiene una función demasiado cercana. Deben existir al menos 30 minutos entre funciones.';
  end if;
  return new;
end;
$$;

create or replace function public.get_screening_waitlist_admin(p_screening_id uuid)
returns table(waitlist_id uuid,user_id uuid,first_name text,last_name text,email text,status text,created_at timestamptz,offer_expires_at timestamptz)
language plpgsql security definer set search_path = ''
as $$
begin
  if auth.uid() is null or not public.has_admin_permission('screenings','view') then
    raise exception 'No tenés permisos para consultar la lista de espera.';
  end if;
  return query
  select w.id,w.user_id,p.first_name,p.last_name,p.email,w.status,w.created_at,w.offer_expires_at
  from public.screening_waitlist w join public.profiles p on p.id=w.user_id
  where w.screening_id=p_screening_id order by w.created_at,w.id;
end;
$$;
revoke all on function public.get_screening_waitlist_admin(uuid) from public,anon;
grant execute on function public.get_screening_waitlist_admin(uuid) to authenticated;
