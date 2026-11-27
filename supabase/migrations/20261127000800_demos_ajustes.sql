-- Fase 7 · Lanzador de demos y Ajustes

create table public.demos (
  id             uuid primary key default gen_random_uuid(),
  nombre         text not null check (length(trim(nombre)) > 0),
  descripcion    text,
  url            text check (url is null or url ~ '^https?://'),
  orden          integer not null default 0,
  activo         boolean not null default true,
  creado_en      timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  creado_por     uuid references auth.users (id) on delete set null default auth.uid()
);

create trigger demos_actualizado_en before update on public.demos
  for each row execute function public.tocar_actualizado_en();
create trigger demos_bitacora after insert or update or delete on public.demos
  for each row execute function public.registrar_bitacora();

alter table public.demos enable row level security;
create policy "miembros leen demos" on public.demos
  for select to authenticated using ((select privado.es_miembro()));
create policy "miembros crean demos" on public.demos
  for insert to authenticated with check ((select privado.es_miembro()));
create policy "miembros editan demos" on public.demos
  for update to authenticated using ((select privado.es_miembro())) with check ((select privado.es_miembro()));
create policy "miembros borran demos" on public.demos
  for delete to authenticated using ((select privado.es_miembro()));

-- La Demo es otro software con su propio acceso. URL: POR CONFIRMAR.
insert into public.demos (nombre, descripcion, url, orden, creado_por)
values ('Demo Ergon Solutions', 'Demo de los servicios para mostrar a prospectos. Tiene su propio acceso.', null, 1, null);

-- Perfil: cada quien solo cambia su nombre, color y avatar (no su correo ni su usuario).
revoke update on public.perfiles from authenticated;
grant update (nombre, color, avatar) on public.perfiles to authenticated;
alter table public.perfiles add constraint perfiles_color_hex check (color ~ '^#[0-9A-Fa-f]{6}$');
alter table public.perfiles add constraint perfiles_nombre_no_vacio check (length(trim(nombre)) > 0);
