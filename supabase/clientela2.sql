-- ===================== Clientela 2.0 en la nube (7 nov 2026) =====================
-- Mismo proyecto de Supabase que Checa y Clientela v1 (gqsadclvftkzwrihfipz).
-- Pegar completo en Supabase → SQL Editor → Run (se puede correr más de una vez).
-- Requiere antes supabase/clientela.sql (usa la función dueno_y_hora).
--
-- Una sola tabla para todo lo de 2.0: cada fila es un objeto de la app (cliente, viaje, gasto, lugar,
-- cotización) o la configuración. No toca las tablas de v1 (sus datos tienen otra forma).
--  · RLS: cada quien lee y escribe solo lo suyo (user_id = auth.uid()).
--  · user_id → auth.users on delete cascade: «Eliminar cuenta» en Checa se lleva esto también.
--  · `borrado` permite sincronizar lo que se eliminó en otro teléfono.

create table if not exists public.clientela2_datos (
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  coleccion   text not null check (coleccion in ('config', 'history', 'clients', 'trips', 'expenses', 'places')),
  id          text not null check (char_length(id) <= 60),
  datos       jsonb not null,
  borrado     boolean not null default false,
  actualizado timestamptz not null default now(),
  primary key (user_id, coleccion, id)
);

create index if not exists clientela2_datos_actualizado on public.clientela2_datos (user_id, actualizado);

alter table public.clientela2_datos enable row level security;

drop policy if exists clientela2_datos_dueno on public.clientela2_datos;
create policy clientela2_datos_dueno on public.clientela2_datos
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop trigger if exists clientela2_datos_dueno_hora on public.clientela2_datos;
create trigger clientela2_datos_dueno_hora before insert or update on public.clientela2_datos
  for each row execute function public.dueno_y_hora();
