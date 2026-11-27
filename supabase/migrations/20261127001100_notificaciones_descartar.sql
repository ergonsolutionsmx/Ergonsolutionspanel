-- Cada quien puede descartar (borrar) sus propias notificaciones.
create policy "cada quien descarta sus notificaciones" on public.notificaciones
  for delete to authenticated
  using (usuario_id = (select auth.uid()) and (select privado.es_miembro()));
grant delete on public.notificaciones to authenticated;
