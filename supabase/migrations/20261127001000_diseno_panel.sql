-- Rediseño del panel: datos nuevos. Solo agrega columnas y tablas; no borra nada.

-- 1. Reuniones en la agenda (4.2): tipo, modalidad y link.
alter table public.eventos
  add column tipo      text not null default 'evento' check (tipo in ('evento', 'reunion')),
  add column modalidad text check (modalidad in ('en_linea', 'presencial')),
  add column enlace    text check (enlace is null or enlace ~* '^https?://');

-- 2. Proyectos: cliente, tipo y etapa del Método Ergon (9).
alter table public.proyectos
  add column cliente text,
  add column tipo    text check (tipo in ('sitio_web', 'turnode', 'software')),
  add column etapa   text;

-- 3. Checklist y comentarios de tareas (9).
create table public.tarea_checklist (
  id             uuid primary key default gen_random_uuid(),
  tarea_id       uuid not null references public.tareas (id) on delete cascade,
  texto          text not null check (length(trim(texto)) > 0),
  hecho          boolean not null default false,
  orden          double precision not null default extract(epoch from clock_timestamp()),
  creado_en      timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  creado_por     uuid references auth.users (id) on delete set null default auth.uid()
);
create index tarea_checklist_tarea_idx on public.tarea_checklist (tarea_id, orden);
create trigger tarea_checklist_actualizado before update on public.tarea_checklist
  for each row execute function public.tocar_actualizado_en();
alter table public.tarea_checklist enable row level security;
create policy "miembros ven checklist" on public.tarea_checklist
  for select to authenticated using ((select privado.es_miembro()));
create policy "miembros crean checklist" on public.tarea_checklist
  for insert to authenticated with check ((select privado.es_miembro()));
create policy "miembros editan checklist" on public.tarea_checklist
  for update to authenticated using ((select privado.es_miembro())) with check ((select privado.es_miembro()));
create policy "miembros borran checklist" on public.tarea_checklist
  for delete to authenticated using ((select privado.es_miembro()));
revoke update on public.tarea_checklist from authenticated;
grant update (texto, hecho, orden) on public.tarea_checklist to authenticated;

create table public.tarea_comentarios (
  id             uuid primary key default gen_random_uuid(),
  tarea_id       uuid not null references public.tareas (id) on delete cascade,
  usuario_id     uuid references auth.users (id) on delete set null default auth.uid(),
  texto          text not null check (length(trim(texto)) > 0),
  creado_en      timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  creado_por     uuid references auth.users (id) on delete set null default auth.uid()
);
create index tarea_comentarios_tarea_idx on public.tarea_comentarios (tarea_id, creado_en);
alter table public.tarea_comentarios enable row level security;
create policy "miembros ven comentarios" on public.tarea_comentarios
  for select to authenticated using ((select privado.es_miembro()));
create policy "miembros comentan" on public.tarea_comentarios
  for insert to authenticated with check ((select privado.es_miembro()) and usuario_id = (select auth.uid()));
create policy "cada quien borra sus comentarios" on public.tarea_comentarios
  for delete to authenticated using ((select privado.es_miembro()) and usuario_id = (select auth.uid()));
revoke update on public.tarea_comentarios from authenticated;

-- 4. Preferencias de notificaciones por persona (11).
--    Llaves: mensaje, tarea, evento, propuesta. Falta la llave = activado.
alter table public.perfiles add column preferencias jsonb not null default '{}'::jsonb;
grant update (preferencias) on public.perfiles to authenticated;

create or replace function privado.notificar(
  p_usuario uuid,
  p_tipo    text,
  p_titulo  text,
  p_cuerpo  text default null,
  p_link    text default null
)
returns uuid
language sql
security definer
set search_path = ''
as $$
  insert into public.notificaciones (usuario_id, tipo, titulo, cuerpo, link, creado_por)
  select p_usuario, p_tipo, p_titulo, p_cuerpo, p_link, auth.uid()
  where coalesce(
    (select (p.preferencias ->> split_part(p_tipo, '_', 1))::boolean
       from public.perfiles p where p.usuario_id = p_usuario),
    true)
  returning id;
$$;
revoke all on function privado.notificar(uuid, text, text, text, text) from public, anon, authenticated;

-- 5. IVA opcional por propuesta (8): si está activo, se suma 16% al total.
alter table public.propuestas add column con_iva boolean not null default false;
grant update (con_iva) on public.propuestas to authenticated;

-- Índices para los filtros nuevos.
create index if not exists eventos_tipo_inicio_idx on public.eventos (tipo, inicio);
create index if not exists bitacora_usuario_idx on public.bitacora (usuario_id, creado_en desc);
create index if not exists bitacora_tabla_idx on public.bitacora (tabla, creado_en desc);
