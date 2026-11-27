-- Fase 1 · Notificaciones en tiempo real

-- Supabase Realtime: el navegador recibe al instante las notificaciones nuevas
-- (respeta RLS: cada quien solo recibe las suyas).
alter publication supabase_realtime add table public.notificaciones;

-- Desde la app solo se puede cambiar "leida" (no el texto ni el destinatario).
revoke update on public.notificaciones from authenticated;
grant update (leida) on public.notificaciones to authenticated;

-- Para que los triggers de fases siguientes (tareas, bandeja, propuestas)
-- generen avisos sin depender de la sesión del usuario.
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
  values (p_usuario, p_tipo, p_titulo, p_cuerpo, p_link, auth.uid())
  returning id;
$$;

revoke all on function privado.notificar(uuid, text, text, text, text) from public, anon, authenticated;
