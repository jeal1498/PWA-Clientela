-- ===================== Puente Checa ↔ Clientela (4 nov 2026) =====================
-- Proyecto de Supabase compartido: gqsadclvftkzwrihfipz. Misma cuenta de Google en las dos apps.
-- Pegar completo en Supabase → SQL Editor → Run (se puede correr más de una vez), o agregarlo al final
-- de supabase/esquema.sql del repo jeal1498/APK-CHECA para que lo despliegue supabase.yml.
--
-- Reglas:
--  · Cada fila lleva user_id = auth.uid(); RLS: cada quien solo lee y escribe lo suyo.
--  · user_id → auth.users on delete cascade: «Eliminar cuenta» de Checa (eliminar-cuenta borra el usuario
--    de Auth al final) se lleva todo esto sin tocar la función.
--  · La tarjeta pública se lee solo con tarjeta_publica(slug): devuelve lo que el conductor eligió mostrar.
--  · Clientes y viajes guardan el objeto completo de la app en `datos` (jsonb) más unas columnas para
--    filtrar; `borrado` permite sincronizar lo que se eliminó en otro teléfono.

-- Llena user_id con la sesión y marca la hora de cambio (el cliente no puede poner otro dueño).
create or replace function public.dueno_y_hora() returns trigger
language plpgsql set search_path = public as $$
begin
  new.user_id := auth.uid();
  new.actualizado := now();
  return new;
end $$;

-- ---------- Perfil del conductor (lo comparten Checa y Clientela) ----------
create table if not exists public.perfil_conductor (
  user_id         uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  nombre          text check (char_length(nombre) <= 80),
  telefono        text check (telefono is null or telefono ~ '^[0-9]{10,15}$'),   -- con lada, solo dígitos
  ciudad          text check (char_length(ciudad) <= 80),
  -- Moneda y formato de montos
  moneda          text not null default 'MXN' check (moneda ~ '^[A-Z]{3}$'),
  simbolo         text not null default '$' check (char_length(simbolo) between 1 and 4),
  simbolo_despues boolean not null default false,          -- «100 €» en vez de «$100»
  sep_miles       text not null default ',' check (sep_miles in (',', '.', ' ', '''', '')),
  sep_decimal     text not null default '.' check (sep_decimal in ('.', ',')),
  decimales       smallint not null default 0 check (decimales between 0 and 2),
  -- Tarifas de Clientela: {perKm, perHour, extra:{base, minimum, airport, night, wait}}
  tarifas         jsonb not null default '{}'::jsonb,
  -- Costo de gasolina por km que escribe Checa (precio por litro / km por litro)
  gasolina_km     numeric check (gasolina_km is null or gasolina_km between 0 and 1000),
  -- Enlace público de la tarjeta: …/tarjeta.html?c=<slug>
  slug            text unique check (slug is null or slug ~ '^[a-z0-9][a-z0-9-]{2,39}$'),
  -- Lo que el conductor eligió mostrar en su tarjeta (mismo formato que el enlace #j…: n, w, c, h, a, r, p, b)
  tarjeta         jsonb,
  -- Resto de ajustes de Clientela (lugares guardados, mensajes…), privados
  ajustes         jsonb not null default '{}'::jsonb,
  creado          timestamptz not null default now(),
  actualizado     timestamptz not null default now()
);
alter table public.perfil_conductor enable row level security;
drop policy if exists "mi perfil" on public.perfil_conductor;
create policy "mi perfil" on public.perfil_conductor
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop trigger if exists dueno_y_hora on public.perfil_conductor;
create trigger dueno_y_hora before insert or update on public.perfil_conductor
  for each row execute function public.dueno_y_hora();

-- Tarjeta pública por slug: solo los campos de la tarjeta y el formato de moneda. Nada más sale de aquí.
create or replace function public.tarjeta_publica(p_slug text) returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(tarjeta, '{}'::jsonb) || jsonb_build_object(
           'moneda', moneda, 'simbolo', simbolo, 'simbolo_despues', simbolo_despues,
           'sep_miles', sep_miles, 'sep_decimal', sep_decimal, 'decimales', decimales)
  from perfil_conductor
  where slug = lower(p_slug) and tarjeta is not null;
$$;
revoke all on function public.tarjeta_publica(text) from public;
grant execute on function public.tarjeta_publica(text) to anon, authenticated;

-- ---------- Clientes de Clientela ----------
create table if not exists public.clientes (
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id          text not null check (char_length(id) <= 40),      -- el id que ya usa la app
  nombre      text check (char_length(nombre) <= 120),
  telefono    text check (char_length(telefono) <= 20),
  datos       jsonb not null,                                   -- el cliente completo de la app
  borrado     boolean not null default false,
  actualizado timestamptz not null default now(),
  primary key (user_id, id)
);
alter table public.clientes enable row level security;
drop policy if exists "mis clientes" on public.clientes;
create policy "mis clientes" on public.clientes
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop trigger if exists dueno_y_hora on public.clientes;
create trigger dueno_y_hora before insert or update on public.clientes
  for each row execute function public.dueno_y_hora();
create index if not exists clientes_cambios on public.clientes (user_id, actualizado);

-- ---------- Viajes privados (Clientela) ----------
create table if not exists public.viajes_privados (
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id          text not null check (char_length(id) <= 40),
  cliente_id  text check (char_length(cliente_id) <= 40),
  fecha       date,
  hora        text check (char_length(hora) <= 8),
  precio      numeric,
  estado      text check (estado in ('agendado', 'hecho', 'cancelado')),
  pago        text check (pago in ('', 'efectivo', 'transferencia', 'tarjeta')),
  datos       jsonb not null,                                   -- el viaje completo de la app
  borrado     boolean not null default false,
  actualizado timestamptz not null default now(),
  primary key (user_id, id)
);
alter table public.viajes_privados enable row level security;
drop policy if exists "mis viajes privados" on public.viajes_privados;
create policy "mis viajes privados" on public.viajes_privados
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop trigger if exists dueno_y_hora on public.viajes_privados;
create trigger dueno_y_hora before insert or update on public.viajes_privados
  for each row execute function public.dueno_y_hora();
create index if not exists viajes_privados_cambios on public.viajes_privados (user_id, actualizado);
create index if not exists viajes_privados_fecha on public.viajes_privados (user_id, fecha);

-- ---------- Contactos de emergencia (SOS de Checa, a futuro) ----------
create table if not exists public.contactos_sos (
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id          uuid not null default gen_random_uuid(),
  nombre      text not null check (char_length(btrim(nombre)) between 1 and 80),
  telefono    text not null check (telefono ~ '^[0-9]{10,15}$'),
  relacion    text check (char_length(relacion) <= 40),
  actualizado timestamptz not null default now(),
  primary key (user_id, id)
);
alter table public.contactos_sos enable row level security;
drop policy if exists "mis contactos sos" on public.contactos_sos;
create policy "mis contactos sos" on public.contactos_sos
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop trigger if exists dueno_y_hora on public.contactos_sos;
create trigger dueno_y_hora before insert or update on public.contactos_sos
  for each row execute function public.dueno_y_hora();

-- ---------- Viajes de Uber/DiDi que acepta en Checa (para «Mi día» unificado) ----------
create table if not exists public.viajes_checa (
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id          uuid not null default gen_random_uuid(),
  app         text check (app in ('uber', 'didi', 'otra')),
  cuando      timestamptz not null default now(),
  tarifa      numeric,
  km          numeric,
  minutos     numeric,
  gasolina    numeric,
  neto        numeric,
  datos       jsonb not null default '{}'::jsonb,
  actualizado timestamptz not null default now(),
  primary key (user_id, id)
);
alter table public.viajes_checa enable row level security;
drop policy if exists "mis viajes checa" on public.viajes_checa;
create policy "mis viajes checa" on public.viajes_checa
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop trigger if exists dueno_y_hora on public.viajes_checa;
create trigger dueno_y_hora before insert or update on public.viajes_checa
  for each row execute function public.dueno_y_hora();
create index if not exists viajes_checa_cuando on public.viajes_checa (user_id, cuando);

-- Nadie anónimo toca las tablas directo (la tarjeta va por la función).
revoke all on public.perfil_conductor, public.clientes, public.viajes_privados, public.contactos_sos, public.viajes_checa from anon;
grant select, insert, update, delete on public.perfil_conductor, public.clientes, public.viajes_privados, public.contactos_sos, public.viajes_checa to authenticated;
