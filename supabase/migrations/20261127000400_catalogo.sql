-- Fase 4 · Catálogo de servicios

create table public.servicios (
  id                   uuid primary key default gen_random_uuid(),
  numero               text not null unique check (numero ~ '^\d{2,3}$'),
  nombre               text not null check (length(trim(nombre)) > 0),
  categorias           text[] not null default '{}',
  estado               text not null default 'pendiente' check (estado in ('listo', 'pendiente', 'proximamente')),
  dificultad           text check (dificultad in ('baja', 'media', 'alta')),  -- null = por confirmar
  lleva_ia             boolean not null default false,
  que_es               text,
  para_quien           text,
  problemas            text[] not null default '{}',  -- frases para el buscador por problema
  cuando_no_recomendar text,
  entregables          text,
  link_drive           text check (link_drive is null or link_drive ~ '^https://'),
  activo               boolean not null default true,  -- se archiva en vez de borrar
  creado_en            timestamptz not null default now(),
  actualizado_en       timestamptz not null default now(),
  creado_por           uuid references auth.users (id) on delete set null default auth.uid()
);

create table public.servicio_variantes (
  id                 uuid primary key default gen_random_uuid(),
  servicio_id        uuid not null references public.servicios (id) on delete cascade,
  nombre             text not null check (nombre in ('basico', 'estandar', 'avanzado', 'unica')),
  que_incluye        text,
  entregables        text,
  tiempo_estimado    text,
  precio_instalacion numeric(12, 2) check (precio_instalacion is null or precio_instalacion >= 0),  -- null = por definir
  precio_mensual     numeric(12, 2) check (precio_mensual is null or precio_mensual >= 0),
  orden              integer not null default 0,
  creado_en          timestamptz not null default now(),
  actualizado_en     timestamptz not null default now(),
  creado_por         uuid references auth.users (id) on delete set null default auth.uid(),
  unique (servicio_id, nombre)
);

create index servicio_variantes_servicio_idx on public.servicio_variantes (servicio_id, orden);

create trigger servicios_actualizado_en before update on public.servicios
  for each row execute function public.tocar_actualizado_en();
create trigger servicio_variantes_actualizado_en before update on public.servicio_variantes
  for each row execute function public.tocar_actualizado_en();

create trigger servicios_bitacora after insert or update or delete on public.servicios
  for each row execute function public.registrar_bitacora();
create trigger servicio_variantes_bitacora after insert or update or delete on public.servicio_variantes
  for each row execute function public.registrar_bitacora();

alter table public.servicios enable row level security;
alter table public.servicio_variantes enable row level security;

create policy "miembros leen servicios" on public.servicios
  for select to authenticated using ((select privado.es_miembro()));
create policy "miembros crean servicios" on public.servicios
  for insert to authenticated with check ((select privado.es_miembro()));
create policy "miembros editan servicios" on public.servicios
  for update to authenticated using ((select privado.es_miembro())) with check ((select privado.es_miembro()));
-- Sin política de DELETE: los servicios se archivan (activo = false).

create policy "miembros leen variantes" on public.servicio_variantes
  for select to authenticated using ((select privado.es_miembro()));
create policy "miembros crean variantes" on public.servicio_variantes
  for insert to authenticated with check ((select privado.es_miembro()));
create policy "miembros editan variantes" on public.servicio_variantes
  for update to authenticated using ((select privado.es_miembro())) with check ((select privado.es_miembro()));
create policy "miembros borran variantes" on public.servicio_variantes
  for delete to authenticated using ((select privado.es_miembro()));
