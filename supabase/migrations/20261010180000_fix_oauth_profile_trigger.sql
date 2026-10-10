-- Ejecutar en Supabase SQL Editor antes de probar OAuth.
-- profiles exige first_name, last_name y birth_date NOT NULL. OAuth no aporta
-- siempre esos campos, así que se crea un perfil provisional que el formulario
-- /completar-perfil reemplaza con los datos reales inmediatamente después.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  metadata jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  full_name text := nullif(trim(coalesce(metadata->>'full_name', metadata->>'name', '')), '');
  first_name_value text;
  last_name_value text;
begin
  first_name_value := coalesce(
    nullif(trim(metadata->>'first_name'), ''),
    nullif(split_part(full_name, ' ', 1), ''),
    'Pendiente'
  );

  last_name_value := coalesce(
    nullif(trim(metadata->>'last_name'), ''),
    nullif(trim(regexp_replace(coalesce(full_name, ''), '^\S+\s*', '')), ''),
    'Pendiente'
  );

  insert into public.profiles (
    id, email, first_name, last_name, birth_date, role
  )
  values (
    new.id,
    new.email,
    first_name_value,
    last_name_value,
    coalesce(
      nullif(metadata->>'birth_date', '')::date,
      current_date
    ),
    'customer'
  )
  on conflict (id) do update
    set email = excluded.email;

  return new;
end;
$$;
