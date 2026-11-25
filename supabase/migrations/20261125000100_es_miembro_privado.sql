-- Mueve es_miembro() a un esquema no expuesto por la API (evita /rest/v1/rpc/es_miembro).
create schema if not exists privado;
revoke all on schema privado from public, anon;
grant usage on schema privado to authenticated;

create or replace function privado.es_miembro()
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

revoke all on function privado.es_miembro() from public, anon;
grant execute on function privado.es_miembro() to authenticated;

-- Recrear políticas apuntando al nuevo esquema
drop policy "miembros leen perfiles" on public.perfiles;
create policy "miembros leen perfiles"
  on public.perfiles for select to authenticated
  using ((select privado.es_miembro()));

drop policy "cada quien lee sus notificaciones" on public.notificaciones;
create policy "cada quien lee sus notificaciones"
  on public.notificaciones for select to authenticated
  using (usuario_id = (select auth.uid()) and (select privado.es_miembro()));

drop policy "cada quien marca sus notificaciones" on public.notificaciones;
create policy "cada quien marca sus notificaciones"
  on public.notificaciones for update to authenticated
  using (usuario_id = (select auth.uid()) and (select privado.es_miembro()))
  with check (usuario_id = (select auth.uid()));

drop policy "miembros crean notificaciones" on public.notificaciones;
create policy "miembros crean notificaciones"
  on public.notificaciones for insert to authenticated
  with check ((select privado.es_miembro()));

drop policy "miembros leen bitacora" on public.bitacora;
create policy "miembros leen bitacora"
  on public.bitacora for select to authenticated
  using ((select privado.es_miembro()));

drop policy "miembros agregan a bitacora" on public.bitacora;
create policy "miembros agregan a bitacora"
  on public.bitacora for insert to authenticated
  with check ((select privado.es_miembro()) and usuario_id = (select auth.uid()));

drop function public.es_miembro();
