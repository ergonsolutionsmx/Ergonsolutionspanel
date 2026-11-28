-- Se puede borrar cualquier propuesta (antes solo los borradores). Sus conceptos se borran en cascada
-- y el borrado queda en la bitácora.
drop policy if exists "miembros borran borradores" on public.propuestas;
create policy "miembros borran propuestas" on public.propuestas
  for delete to authenticated using ((select privado.es_miembro()));
