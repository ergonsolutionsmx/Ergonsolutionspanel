-- Fase 10 · Endurecimiento y rendimiento

-- Defensa en profundidad: el rol anónimo no tiene permisos sobre ninguna tabla
-- (la RLS ya lo bloqueaba). Las únicas puertas públicas son la función
-- propuesta_publica y los endpoints del servidor con la llave de servicio.
revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;
alter default privileges in schema public revoke all on tables from anon;
alter default privileges in schema public revoke all on sequences from anon;

-- Índices para llaves foráneas que se filtran o se usan al borrar.
create index if not exists bitacora_usuario_idx on public.bitacora (usuario_id, creado_en desc);
create index if not exists proyectos_responsable_idx on public.proyectos (responsable_id);
create index if not exists propuesta_conceptos_servicio_idx on public.propuesta_conceptos (servicio_id);
create index if not exists propuesta_conceptos_variante_idx on public.propuesta_conceptos (variante_id);
create index if not exists propuestas_creado_por_idx on public.propuestas (creado_por);
create index if not exists tareas_creado_por_idx on public.tareas (creado_por);
