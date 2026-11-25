-- Restrict direct API access to internal tables.
-- Application workflows access these records through validated SECURITY DEFINER RPCs.
-- RLS remains enabled and no client-facing policies are introduced.

begin;

revoke all on table public.cancellation_compensations
  from public, anon, authenticated;
revoke all on table public.candy_bar_redemptions
  from public, anon, authenticated;
revoke all on table public.coupon_redemptions
  from public, anon, authenticated;
revoke all on table public.role_change_authorizations
  from public, anon, authenticated;
revoke all on table public.screening_cancellations
  from public, anon, authenticated;

commit;
