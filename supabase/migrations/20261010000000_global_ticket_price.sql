-- Unifica el precio base de las entradas para todas las funciones.
-- Ejecutar una vez en Supabase SQL Editor al integrar este cambio.

CREATE OR REPLACE FUNCTION public.set_global_ticket_price(p_price numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Debés iniciar sesión';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Solo un administrador puede cambiar el precio';
  END IF;

  IF p_price IS NULL OR p_price < 0 THEN
    RAISE EXCEPTION 'El precio debe ser mayor o igual a cero';
  END IF;

  INSERT INTO public.ticket_pricing_settings (
    id,
    base_price,
    updated_at,
    updated_by
  )
  VALUES (true, p_price, now(), auth.uid())
  ON CONFLICT (id) DO UPDATE
  SET
    base_price = EXCLUDED.base_price,
    updated_at = now(),
    updated_by = auth.uid();

  -- WHERE explícito para actualizar únicamente las funciones
  -- cuyo precio todavía no coincide con el nuevo precio base.
  UPDATE public.screenings
  SET price = p_price
  WHERE id IS NOT NULL
    AND price IS DISTINCT FROM p_price;
END;
$$;

REVOKE ALL ON FUNCTION public.set_global_ticket_price(numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_global_ticket_price(numeric) TO authenticated;
