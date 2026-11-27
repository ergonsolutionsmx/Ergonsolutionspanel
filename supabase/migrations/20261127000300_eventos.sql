-- Fase 3 · Agenda: eventos

create table public.eventos (
  id             uuid primary key default gen_random_uuid(),
  titulo         text not null check (length(trim(titulo)) > 0),
  inicio         timestamptz not null,
  fin            timestamptz not null,
  todo_el_dia    boolean not null default false,
  lugar          text,
  notas          text,
  responsable_id uuid references auth.users (id) on delete set null,
  creado_en      timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  creado_por     uuid references auth.users (id) on delete set null default auth.uid(),
  constraint eventos_fin_despues_de_inicio check (fin >= inicio)
);

create index eventos_rango_idx on public.eventos (inicio, fin);
create index eventos_responsable_idx on public.eventos (responsable_id);

create trigger eventos_actualizado_en
  before update on public.eventos
  for each row execute function public.tocar_actualizado_en();

create trigger eventos_bitacora
  after insert or update or delete on public.eventos
  for each row execute function public.registrar_bitacora();

alter table public.eventos enable row level security;

create policy "miembros leen eventos" on public.eventos
  for select to authenticated using ((select privado.es_miembro()));
create policy "miembros crean eventos" on public.eventos
  for insert to authenticated with check ((select privado.es_miembro()));
create policy "miembros editan eventos" on public.eventos
  for update to authenticated using ((select privado.es_miembro())) with check ((select privado.es_miembro()));
create policy "miembros borran eventos" on public.eventos
  for delete to authenticated using ((select privado.es_miembro()));
