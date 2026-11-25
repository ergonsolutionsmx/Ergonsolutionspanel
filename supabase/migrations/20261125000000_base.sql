-- Fase 0 · Base: perfiles, notificaciones, bitácora
-- Convenciones: todas las tablas llevan id, creado_en, actualizado_en, creado_por.
-- RLS activa en todas: solo usuarios autenticados que existan en `perfiles`.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Utilidades
-- ---------------------------------------------------------------------------

-- Mantiene `actualizado_en` al día en cada UPDATE.
create or replace function public.tocar_actualizado_en()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.actualizado_en := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- perfiles
-- ---------------------------------------------------------------------------
create table public.perfiles (
  id             uuid primary key default gen_random_uuid(),
  usuario_id     uuid not null unique references auth.users (id) on delete cascade,
  nombre         text not null,
  correo         text not null,
  color          text not null default '#2563EB',
  avatar         text,
  creado_en      timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  creado_por     uuid references auth.users (id) default auth.uid()
);

create trigger perfiles_actualizado_en
  before update on public.perfiles
  for each row execute function public.tocar_actualizado_en();

-- ¿El usuario de la sesión es miembro del panel? (Jorge o Antonio)
-- SECURITY DEFINER para poder leer `perfiles` sin chocar con su propia RLS.
create or replace function public.es_miembro()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.perfiles p where p.usuario_id = auth.uid()
  );
$$;

revoke all on function public.es_miembro() from public, anon;
grant execute on function public.es_miembro() to authenticated;

alter table public.perfiles enable row level security;

create policy "miembros leen perfiles"
  on public.perfiles for select to authenticated
  using ((select public.es_miembro()));

-- Cada quien edita solo su propio perfil. Los perfiles se crean con el script
-- (service role), nunca desde la app: no hay política de INSERT ni DELETE.
create policy "cada quien edita su perfil"
  on public.perfiles for update to authenticated
  using (usuario_id = (select auth.uid()))
  with check (usuario_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- notificaciones
-- ---------------------------------------------------------------------------
create table public.notificaciones (
  id             uuid primary key default gen_random_uuid(),
  usuario_id     uuid not null references auth.users (id) on delete cascade,
  tipo           text not null,
  titulo         text not null,
  cuerpo         text,
  link           text,
  leida          boolean not null default false,
  creado_en      timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  creado_por     uuid references auth.users (id) default auth.uid()
);

create index notificaciones_usuario_idx
  on public.notificaciones (usuario_id, leida, creado_en desc);

create trigger notificaciones_actualizado_en
  before update on public.notificaciones
  for each row execute function public.tocar_actualizado_en();

alter table public.notificaciones enable row level security;

-- Cada quien ve y marca solo sus notificaciones.
create policy "cada quien lee sus notificaciones"
  on public.notificaciones for select to authenticated
  using (usuario_id = (select auth.uid()) and (select public.es_miembro()));

create policy "cada quien marca sus notificaciones"
  on public.notificaciones for update to authenticated
  using (usuario_id = (select auth.uid()) and (select public.es_miembro()))
  with check (usuario_id = (select auth.uid()));

-- Un miembro puede generar avisos para el otro (p. ej. al asignarle algo).
create policy "miembros crean notificaciones"
  on public.notificaciones for insert to authenticated
  with check ((select public.es_miembro()));

-- ---------------------------------------------------------------------------
-- bitacora (solo se agrega; nunca se edita ni se borra)
-- ---------------------------------------------------------------------------
create table public.bitacora (
  id             uuid primary key default gen_random_uuid(),
  usuario_id     uuid references auth.users (id) on delete set null default auth.uid(),
  accion         text not null,
  tabla          text,
  registro_id    uuid,
  detalle        jsonb not null default '{}'::jsonb,
  creado_en      timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  creado_por     uuid references auth.users (id) on delete set null default auth.uid()
);

create index bitacora_creado_idx on public.bitacora (creado_en desc);
create index bitacora_tabla_idx on public.bitacora (tabla, registro_id);

alter table public.bitacora enable row level security;

create policy "miembros leen bitacora"
  on public.bitacora for select to authenticated
  using ((select public.es_miembro()));

create policy "miembros agregan a bitacora"
  on public.bitacora for insert to authenticated
  with check ((select public.es_miembro()) and usuario_id = (select auth.uid()));

-- Trigger genérico para registrar cambios de cualquier tabla en la bitácora.
-- Se engancha a las tablas importantes en fases siguientes:
--   create trigger x_bitacora after insert or update or delete on public.x
--   for each row execute function public.registrar_bitacora();
create or replace function public.registrar_bitacora()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_registro uuid;
  v_detalle  jsonb;
begin
  if tg_op = 'DELETE' then
    v_registro := old.id;
    v_detalle  := jsonb_build_object('antes', to_jsonb(old));
  elsif tg_op = 'UPDATE' then
    v_registro := new.id;
    v_detalle  := jsonb_build_object('antes', to_jsonb(old), 'despues', to_jsonb(new));
  else
    v_registro := new.id;
    v_detalle  := jsonb_build_object('despues', to_jsonb(new));
  end if;

  insert into public.bitacora (usuario_id, accion, tabla, registro_id, detalle, creado_por)
  values (auth.uid(), lower(tg_op), tg_table_name, v_registro, v_detalle, auth.uid());

  return coalesce(new, old);
end;
$$;

revoke all on function public.registrar_bitacora() from public, anon, authenticated;

-- Cambios de perfil también quedan en bitácora.
create trigger perfiles_bitacora
  after update on public.perfiles
  for each row execute function public.registrar_bitacora();
