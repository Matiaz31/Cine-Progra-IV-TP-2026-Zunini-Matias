-- Verificación de políticas RLS para los permisos administrativos configurables.
-- Este archivo es de solo lectura: no modifica políticas ni datos.

-- 1) Comprobar que RLS esté habilitado en las tablas administrativas.
SELECT
  c.relname AS tabla,
  c.relrowsecurity AS rls_habilitado,
  c.relforcerowsecurity AS rls_forzado
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND c.relname IN (
    'movies',
    'genres',
    'movie_proposals',
    'rooms',
    'seats',
    'screenings',
    'products',
    'product_categories',
    'combos',
    'combo_items',
    'coupons',
    'rewards',
    'activity_logs',
    'ticket_pricing_settings'
  )
ORDER BY c.relname;

-- 2) Revisar las políticas SELECT / INSERT / UPDATE / DELETE de esas tablas.
-- En las operaciones administrativas, las expresiones deben comprobar
-- has_admin_permission('<sección>', '<acción>') según corresponda.
SELECT
  tablename AS tabla,
  policyname AS politica,
  cmd AS operacion,
  qual AS condicion_using,
  with_check AS condicion_with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'movies',
    'genres',
    'movie_proposals',
    'rooms',
    'seats',
    'screenings',
    'products',
    'product_categories',
    'combos',
    'combo_items',
    'coupons',
    'rewards',
    'activity_logs',
    'ticket_pricing_settings'
  )
ORDER BY tablename, cmd, policyname;

-- 3) Revisar los permisos configurados para cada rol administrativo.
SELECT
  r.name AS rol,
  p.section AS seccion,
  p.action AS accion
FROM public.admin_roles r
JOIN public.admin_role_permissions p
  ON p.admin_role_id = r.id
ORDER BY r.name, p.section, p.action;
