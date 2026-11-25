-- Align RPC permissions with the production hardening applied on 2026-11-25.
-- Keep the 8-argument checkout as the only public purchase entry point.
-- Internal SECURITY DEFINER helpers remain callable by their owning role from checkout_purchase.

begin;

revoke all on function public.checkout_purchase(uuid, uuid[], jsonb, jsonb, text, uuid, uuid)
  from public, anon, authenticated;
revoke all on function public.checkout_purchase(uuid, uuid[], jsonb, jsonb, text, uuid, uuid, boolean)
  from public, anon, authenticated;
grant execute on function public.checkout_purchase(uuid, uuid[], jsonb, jsonb, text, uuid, uuid, boolean)
  to anon, authenticated;

-- Purchase helpers must not be callable as independent RPC endpoints.
revoke all on function public.create_order(uuid, numeric, numeric, text)
  from public, anon, authenticated;
revoke all on function public.add_order_item(uuid, public.order_item_type, uuid, integer, numeric)
  from public, anon, authenticated;
revoke all on function public.add_order_item(uuid, public.order_item_type, uuid, integer, numeric, uuid)
  from public, anon, authenticated;
revoke all on function public.create_ticket(uuid, uuid, text)
  from public, anon, authenticated;
revoke all on function public.create_ticket(uuid, uuid, text, uuid[])
  from public, anon, authenticated;
revoke all on function public.add_ticket_seat(uuid, uuid)
  from public, anon, authenticated;
revoke all on function public.apply_ticket_reward(uuid, uuid, uuid)
  from public, anon, authenticated;

-- Trigger functions are invoked by PostgreSQL triggers, not directly by API clients.
revoke all on function public.broadcast_ticket_seat_change()
  from public, anon, authenticated;
revoke all on function public.handle_new_user()
  from public, anon, authenticated;
revoke all on function public.on_room_created_generate_seats()
  from public, anon, authenticated;
revoke all on function public.prevent_admin_role_assignment_change()
  from public, anon, authenticated;
revoke all on function public.prevent_role_change()
  from public, anon, authenticated;
revoke all on function public.recalculate_order_total()
  from public, anon, authenticated;
revoke all on function public.register_order_points_redemption()
  from public, anon, authenticated;
revoke all on function public.validate_order_coupon_before_paid()
  from public, anon, authenticated;

-- Room seat generation is an administrative operation, not a public RPC.
revoke all on function public.generate_room_seats(uuid)
  from public, anon, authenticated;

-- Test-only payment confirmation must not be callable by application clients.
revoke all on function public.confirm_test_order_paid(uuid)
  from public, anon, authenticated;

-- Role lookup is only meaningful for an authenticated session.
revoke all on function public.get_my_role()
  from public, anon;
grant execute on function public.get_my_role()
  to authenticated;

-- Pin search_path for trigger functions to avoid object shadowing.
alter function public.check_screening_time() set search_path = '';
alter function public.set_ticket_seat_screening() set search_path = '';
alter function public.set_ticket_seat_price() set search_path = '';

commit;
