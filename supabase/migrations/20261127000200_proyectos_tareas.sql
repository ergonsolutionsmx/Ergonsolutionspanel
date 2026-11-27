-- Fase 2 · Proyectos y tareas

-- ---------------------------------------------------------------------------
-- proyectos
-- ---------------------------------------------------------------------------
create table public.proyectos (
  id             uuid primary key default gen_random_uuid(),
  nombre         text not null check (length(trim(nombre)) > 0),
  descripcion    text,
  estado         text not null default 'activo' check (estado in ('activo', 'pausado', 'terminado')),
  responsable_id uuid references auth.users (id) on delete set null,
  fecha_objetivo date,
  creado_en      timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  creado_por     uuid references auth.users (id) on delete set null default auth.uid()
);

create index proyectos_estado_idx on public.proyectos (estado);

create trigger proyectos_actualizado_en
  before update on public.proyectos
  for each row execute function public.tocar_actualizado_en();

create trigger proyectos_bitacora
  after insert or update or delete on public.proyectos
  for each row execute function public.registrar_bitacora();

alter table public.proyectos enable row level security;

create policy "miembros leen proyectos" on public.proyectos
  for select to authenticated using ((select privado.es_miembro()));
create policy "miembros crean proyectos" on public.proyectos
  for insert to authenticated with check ((select privado.es_miembro()));
create policy "miembros editan proyectos" on public.proyectos
  for update to authenticated using ((select privado.es_miembro())) with check ((select privado.es_miembro()));
create policy "miembros borran proyectos" on public.proyectos
  for delete to authenticated using ((select privado.es_miembro()));

-- ---------------------------------------------------------------------------
-- tareas
-- ---------------------------------------------------------------------------
create table public.tareas (
  id             uuid primary key default gen_random_uuid(),
  titulo         text not null check (length(trim(titulo)) > 0),
  descripcion    text,
  proyecto_id    uuid references public.proyectos (id) on delete set null,  -- opcional: tareas sueltas
  responsable_id uuid references auth.users (id) on delete set null,
  fecha_limite   date,
  prioridad      text not null default 'media' check (prioridad in ('baja', 'media', 'alta')),
  estado         text not null default 'por_hacer' check (estado in ('por_hacer', 'en_curso', 'en_revision', 'hecha')),
  orden          double precision not null default extract(epoch from clock_timestamp()),
  completada_en  timestamptz,
  creado_en      timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  creado_por     uuid references auth.users (id) on delete set null default auth.uid()
);

create index tareas_estado_orden_idx on public.tareas (estado, orden);
create index tareas_responsable_idx on public.tareas (responsable_id);
create index tareas_proyecto_idx on public.tareas (proyecto_id);
create index tareas_fecha_limite_idx on public.tareas (fecha_limite) where estado <> 'hecha';

create trigger tareas_actualizado_en
  before update on public.tareas
  for each row execute function public.tocar_actualizado_en();

-- Guarda cuándo se terminó una tarea.
create or replace function public.tareas_marcar_completada()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.estado = 'hecha' and (tg_op = 'INSERT' or old.estado is distinct from 'hecha') then
    new.completada_en := now();
  elsif new.estado <> 'hecha' then
    new.completada_en := null;
  end if;
  return new;
end;
$$;

create trigger tareas_completada
  before insert or update of estado on public.tareas
  for each row execute function public.tareas_marcar_completada();

-- Bitácora: alta, baja y cambios reales (no registra solo reordenar dentro de la columna).
create trigger tareas_bitacora_alta_baja
  after insert or delete on public.tareas
  for each row execute function public.registrar_bitacora();

create trigger tareas_bitacora_cambios
  after update on public.tareas
  for each row
  when ((to_jsonb(old) - 'orden' - 'actualizado_en') is distinct from (to_jsonb(new) - 'orden' - 'actualizado_en'))
  execute function public.registrar_bitacora();

alter table public.tareas enable row level security;

create policy "miembros leen tareas" on public.tareas
  for select to authenticated using ((select privado.es_miembro()));
create policy "miembros crean tareas" on public.tareas
  for insert to authenticated with check ((select privado.es_miembro()));
create policy "miembros editan tareas" on public.tareas
  for update to authenticated using ((select privado.es_miembro())) with check ((select privado.es_miembro()));
create policy "miembros borran tareas" on public.tareas
  for delete to authenticated using ((select privado.es_miembro()));

-- ---------------------------------------------------------------------------
-- Notificación: "me asignan una tarea" (solo si me la asigna otra persona)
-- ---------------------------------------------------------------------------
create or replace function privado.avisar_tarea_asignada()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_quien text;
begin
  if new.responsable_id is null
     or new.responsable_id = auth.uid()
     or (tg_op = 'UPDATE' and old.responsable_id is not distinct from new.responsable_id) then
    return new;
  end if;

  select nombre into v_quien from public.perfiles where usuario_id = auth.uid();

  perform privado.notificar(
    new.responsable_id,
    'tarea_asignada',
    'Te asignaron una tarea',
    coalesce(v_quien, 'Alguien') || ': ' || new.titulo,
    '/proyectos/tareas/' || new.id
  );
  return new;
end;
$$;

revoke all on function privado.avisar_tarea_asignada() from public, anon, authenticated;

create trigger tareas_aviso_asignada
  after insert or update of responsable_id on public.tareas
  for each row execute function privado.avisar_tarea_asignada();

-- ---------------------------------------------------------------------------
-- Notificación diaria: "una tarea mía vence hoy" (8:00 a. m. hora de CDMX)
-- ---------------------------------------------------------------------------
create or replace function privado.avisar_tareas_de_hoy()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_hoy   date := (now() at time zone 'America/Mexico_City')::date;
  v_total integer := 0;
  t       record;
begin
  for t in
    select id, titulo, responsable_id
    from public.tareas
    where fecha_limite = v_hoy
      and estado <> 'hecha'
      and responsable_id is not null
  loop
    -- No repetir si ya se avisó hoy de esta tarea.
    if not exists (
      select 1 from public.notificaciones n
      where n.usuario_id = t.responsable_id
        and n.tipo = 'tarea_vence_hoy'
        and n.link = '/proyectos/tareas/' || t.id
        and (n.creado_en at time zone 'America/Mexico_City')::date = v_hoy
    ) then
      perform privado.notificar(t.responsable_id, 'tarea_vence_hoy', 'Vence hoy', t.titulo, '/proyectos/tareas/' || t.id);
      v_total := v_total + 1;
    end if;
  end loop;
  return v_total;
end;
$$;

revoke all on function privado.avisar_tareas_de_hoy() from public, anon, authenticated;

create extension if not exists pg_cron;

-- 14:00 UTC = 8:00 a. m. en Ciudad de México (sin horario de verano).
select cron.schedule('tareas-vencen-hoy', '0 14 * * *', $$select privado.avisar_tareas_de_hoy()$$);
