-- Preserve the full value of a purchase when a cancellation credit was used,
-- and collect a verified email for anonymous purchases so credits can be claimed.

begin;

CREATE OR REPLACE FUNCTION public.cancel_screening(p_screening_id uuid, p_reason text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_actor uuid;
  v_screening public.screenings;
  v_cancellation_id uuid;
  v_order record;
  v_affected_orders integer := 0;
  v_affected_tickets integer := 0;
  v_credit_count integer := 0;
  v_unassignable_orders integer := 0;
  v_message text;
begin
  v_actor := auth.uid();

  if v_actor is null then
    raise exception 'Debés iniciar sesión para cancelar una función.';
  end if;
  if not public.has_admin_permission('screenings', 'delete') then
    raise exception 'No tenés permiso para cancelar funciones.';
  end if;
  if p_screening_id is null then
    raise exception 'La función seleccionada no es válida.';
  end if;
  if p_reason is null or btrim(p_reason) = '' then
    raise exception 'Ingresá el motivo de la cancelación.';
  end if;

  select * into v_screening
  from public.screenings
  where id = p_screening_id
  for update;

  if not found then
    raise exception 'La función seleccionada no existe.';
  end if;
  if v_screening.status <> 'scheduled' then
    raise exception 'La función ya fue cancelada o no está disponible.';
  end if;
  if v_screening.start_time <= now() then
    raise exception 'No se puede cancelar una función que ya comenzó.';
  end if;

  if exists (
    select 1
    from public.tickets t
    where t.screening_id = p_screening_id
      and exists (
        select 1 from public.tickets other_ticket
        where other_ticket.order_id = t.order_id
          and other_ticket.screening_id <> p_screening_id
      )
  ) then
    raise exception 'Hay compras asociadas a más de una función; se requiere distribuir sus importes antes de cancelar.';
  end if;

  if exists (
    select 1 from public.tickets t
    where t.screening_id = p_screening_id and t.status = 'used'
  ) then
    raise exception 'La función contiene entradas utilizadas y no puede cancelarse.';
  end if;

  select count(distinct t.order_id)::integer
  into v_affected_orders
  from public.tickets t
  join public.orders o on o.id = t.order_id
  where t.screening_id = p_screening_id and o.status = 'paid';

  select count(distinct o.id)::integer
  into v_unassignable_orders
  from public.orders o
  where o.status = 'paid'
    and o.user_id is null
    and nullif(btrim(o.buyer_email), '') is null
    and exists (
      select 1 from public.tickets t
      where t.order_id = o.id and t.screening_id = p_screening_id
    );

  insert into public.screening_cancellations (
    screening_id, reason, cancelled_by, cancelled_at,
    affected_orders_count, created_at
  )
  values (
    p_screening_id, btrim(p_reason), v_actor, now(),
    v_affected_orders, now()
  )
  returning id into v_cancellation_id;

  update public.screenings set status = 'cancelled'
  where id = p_screening_id;

  update public.screening_waitlist
  set status = 'cancelled',
      offered_seat_ids = null,
      offer_expires_at = null,
      updated_at = now()
  where screening_id = p_screening_id
    and status in ('waiting', 'offered');

  for v_order in
    select o.id as order_id, o.user_id, o.buyer_email,
           greatest(coalesce(o.total, 0) + coalesce(o.credit_used, 0), 0) as total
    from public.orders o
    where o.status = 'paid'
      and exists (
        select 1 from public.tickets t
        where t.order_id = o.id and t.screening_id = p_screening_id
      )
    order by o.id
    for update of o
  loop
    -- Only create a claimable credit when a registered user or an email recipient exists.
    -- Anonymous orders without either identifier remain in the cancellation audit but do not block it.
    if v_order.user_id is not null
       or nullif(btrim(v_order.buyer_email), '') is not null then
      insert into public.screening_cancellation_credits (
        cancellation_id, order_id, user_id, buyer_email,
        amount, status, created_at
      )
      values (
        v_cancellation_id,
        v_order.order_id,
        v_order.user_id,
        case when v_order.user_id is null then lower(btrim(v_order.buyer_email)) else null end,
        greatest(v_order.total, 0),
        case when v_order.user_id is null then 'pending_claim' else 'available' end,
        now()
      );

      v_credit_count := v_credit_count + 1;
    end if;

    if v_order.user_id is not null and v_order.total > 0 then
      insert into public.credits (
        user_id, type, amount, order_id, description, created_at
      )
      values (
        v_order.user_id,
        'adjustment'::public.credit_transaction_type,
        v_order.total,
        v_order.order_id,
        'Crédito por cancelación de función. Compensación ' || v_cancellation_id::text,
        now()
      );
    end if;

    if v_order.user_id is not null then
      v_message :=
        'Se canceló la función "' ||
        coalesce((select m.title from public.movies m where m.id = v_screening.movie_id), 'Película') ||
        '". Se generó un crédito de $' ||
        to_char(greatest(v_order.total, 0), 'FM999999999990D00') ||
        ' asociado a tu compra. Podés consultar otras funciones de la misma película.';

      insert into public.notifications (
        user_id, movie_id, type, message, created_at
      )
      values (
        v_order.user_id, v_screening.movie_id,
        'screening_cancelled', v_message, now()
      );
    end if;
  end loop;

  update public.tickets
  set status = 'cancelled'
  where screening_id = p_screening_id and status = 'valid';
  get diagnostics v_affected_tickets = row_count;

  insert into public.activity_logs (
    user_id, action, entity_type, entity_id, details, created_at
  )
  values (
    v_actor, 'screening_cancelled', 'screenings', p_screening_id,
    jsonb_build_object(
      'cancellation_id', v_cancellation_id,
      'reason', btrim(p_reason),
      'affected_orders', v_affected_orders,
      'affected_tickets', v_affected_tickets,
      'credits_created', v_credit_count,
      'orders_without_credit_recipient', v_unassignable_orders
    ),
    now()
  );

  return jsonb_build_object(
    'cancellation_id', v_cancellation_id,
    'screening_id', p_screening_id,
    'affected_orders', v_affected_orders,
    'affected_tickets', v_affected_tickets,
    'credits_created', v_credit_count,
    'orders_without_credit_recipient', v_unassignable_orders,
    'status', 'cancelled'
  );
end;
$function$;

create or replace function public.checkout_purchase(
  p_screening_id uuid,
  p_seat_ids uuid[],
  p_products jsonb,
  p_combos jsonb,
  p_coupon_code text,
  p_reward_id uuid,
  p_reward_seat_id uuid,
  p_use_cancellation_credit boolean,
  p_buyer_email text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid;
  v_email text;
  v_result jsonb;
  v_order_id uuid;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    v_email := lower(btrim(coalesce(p_buyer_email, '')));
    if v_email = ''
       or v_email !~ '^[A-Za-z0-9.!#$%&''*+/=?^_`{|}~-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+$' then
      raise exception 'Ingresá un correo electrónico válido para recibir créditos por cancelación.';
    end if;
  else
    v_email := null;
  end if;

  v_result := public.checkout_purchase(
    p_screening_id,
    p_seat_ids,
    p_products,
    p_combos,
    p_coupon_code,
    p_reward_id,
    p_reward_seat_id,
    p_use_cancellation_credit
  );

  v_order_id := (v_result #>> '{order,id}')::uuid;

  if v_user_id is null then
    update public.orders
    set buyer_email = v_email
    where id = v_order_id
      and user_id is null
      and status = 'paid';

    if not found then
      raise exception 'No se pudo asociar el correo a la compra anónima.';
    end if;

    v_result := jsonb_set(
      v_result,
      '{order,buyer_email}',
      to_jsonb(v_email),
      true
    );
  end if;

  return v_result;
end;
$function$;

-- Anonymous clients must use the email-aware checkout overload.
revoke all on function public.checkout_purchase(uuid, uuid[], jsonb, jsonb, text, uuid, uuid)
  from public, anon;
revoke all on function public.checkout_purchase(uuid, uuid[], jsonb, jsonb, text, uuid, uuid, boolean)
  from public, anon;
revoke all on function public.checkout_purchase(uuid, uuid[], jsonb, jsonb, text, uuid, uuid, boolean, text)
  from public, anon, authenticated;
grant execute on function public.checkout_purchase(uuid, uuid[], jsonb, jsonb, text, uuid, uuid, boolean, text)
  to anon, authenticated;

commit;
