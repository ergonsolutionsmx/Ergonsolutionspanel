-- Fase 6 · Bandeja de entrada

create table public.mensajes (
  id                 uuid primary key default gen_random_uuid(),
  canal              text not null check (canal in ('formulario', 'correo', 'whatsapp', 'interno')),
  remitente_nombre   text,
  remitente_contacto text,
  asunto             text,
  cuerpo             text not null default '',
  recibido_en        timestamptz not null default now(),
  estado             text not null default 'nuevo' check (estado in ('nuevo', 'leido', 'respondido', 'archivado')),
  asignado_a         uuid references auth.users (id) on delete set null,
  externo_id         text,  -- id del canal (wamid, id de Gmail, hash del formulario…) para no duplicar
  datos_crudos       jsonb not null default '{}'::jsonb,
  creado_en          timestamptz not null default now(),
  actualizado_en     timestamptz not null default now(),
  creado_por         uuid references auth.users (id) on delete set null default auth.uid(),
  constraint mensajes_externo_unico unique (canal, externo_id)
);

create index mensajes_bandeja_idx on public.mensajes (estado, recibido_en desc);
create index mensajes_asignado_idx on public.mensajes (asignado_a);

create trigger mensajes_actualizado_en before update on public.mensajes
  for each row execute function public.tocar_actualizado_en();
create trigger mensajes_bitacora after insert or update or delete on public.mensajes
  for each row execute function public.registrar_bitacora();

alter table public.mensajes enable row level security;
create policy "miembros leen mensajes" on public.mensajes
  for select to authenticated using ((select privado.es_miembro()));
-- Los miembros pueden crear mensajes (mensajes de prueba y avisos desde la app).
create policy "miembros crean mensajes" on public.mensajes
  for insert to authenticated with check ((select privado.es_miembro()));
create policy "miembros atienden mensajes" on public.mensajes
  for update to authenticated using ((select privado.es_miembro())) with check ((select privado.es_miembro()));
-- Sin DELETE: los mensajes se archivan. Desde la app solo cambia estado y asignado.
revoke update on public.mensajes from authenticated;
grant update (estado, asignado_a) on public.mensajes to authenticated;

-- Tarea creada desde un mensaje ("Convertir en tarea").
alter table public.tareas add column mensaje_id uuid references public.mensajes (id) on delete set null;
create index tareas_mensaje_idx on public.tareas (mensaje_id);

-- Aviso al asignar un mensaje a otra persona.
create or replace function privado.avisar_mensaje_asignado()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_quien text;
begin
  if new.asignado_a is null
     or new.asignado_a = auth.uid()
     or (tg_op = 'UPDATE' and old.asignado_a is not distinct from new.asignado_a) then
    return new;
  end if;
  select nombre into v_quien from public.perfiles where usuario_id = auth.uid();
  perform privado.notificar(
    new.asignado_a, 'mensaje_asignado', 'Te asignaron un mensaje',
    coalesce(v_quien || ': ', '') || coalesce(new.asunto, new.remitente_nombre, 'Mensaje'),
    '/bandeja/' || new.id);
  return new;
end;
$$;
revoke all on function privado.avisar_mensaje_asignado() from public, anon, authenticated;

create trigger mensajes_aviso_asignado
  after insert or update of asignado_a on public.mensajes
  for each row execute function privado.avisar_mensaje_asignado();

-- ---------------------------------------------------------------------------
-- Canales
-- ---------------------------------------------------------------------------
create table public.canales_config (
  id                    uuid primary key default gen_random_uuid(),
  canal                 text not null unique check (canal in ('formulario', 'correo', 'whatsapp', 'interno')),
  activo                boolean not null default false,
  estado_conexion       text not null default 'no_conectado' check (estado_conexion in ('activo', 'no_conectado', 'error')),
  ultima_sincronizacion timestamptz,
  notas                 text,
  creado_en             timestamptz not null default now(),
  actualizado_en        timestamptz not null default now(),
  creado_por            uuid references auth.users (id) on delete set null default auth.uid()
);

insert into public.canales_config (canal, activo, estado_conexion, notas) values
  ('interno', true, 'activo', 'Avisos del propio panel (propuestas vistas o vencidas, tareas vencidas).'),
  ('formulario', false, 'no_conectado', 'Listo: endpoint POST /api/inbox/formulario. Falta conectar el sitio.'),
  ('correo', false, 'no_conectado', 'Listo para Gmail API (OAuth). Se configura después.'),
  ('whatsapp', false, 'no_conectado', 'Listo para WhatsApp Business (Meta Cloud API). Apagado hasta tener cuenta y número.');

create trigger canales_config_actualizado_en before update on public.canales_config
  for each row execute function public.tocar_actualizado_en();
create trigger canales_config_bitacora after update on public.canales_config
  for each row execute function public.registrar_bitacora();

alter table public.canales_config enable row level security;
create policy "miembros leen canales" on public.canales_config
  for select to authenticated using ((select privado.es_miembro()));
create policy "miembros editan canales" on public.canales_config
  for update to authenticated using ((select privado.es_miembro())) with check ((select privado.es_miembro()));
revoke update on public.canales_config from authenticated;
grant update (notas) on public.canales_config to authenticated;

-- ---------------------------------------------------------------------------
-- Entrada desde canales externos (solo el servidor, con la llave de servicio)
-- ---------------------------------------------------------------------------
create table privado.limite_envios (
  clave    text not null,       -- p. ej. "formulario:203.0.113.5"
  ventana  timestamptz not null,
  conteo   integer not null default 0,
  primary key (clave, ventana)
);
revoke all on privado.limite_envios from public, anon, authenticated;

create or replace function public.inbox_ingresar(
  p_canal      text,
  p_externo_id text,
  p_nombre     text,
  p_contacto   text,
  p_asunto     text,
  p_cuerpo     text,
  p_crudos     jsonb default '{}'::jsonb,
  p_ip         text default null,
  p_max_por_ventana integer default 5,
  p_minutos_ventana integer default 10
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ventana timestamptz;
  v_conteo  integer;
  v_id      uuid;
begin
  if p_canal not in ('formulario', 'correo', 'whatsapp') then
    raise exception 'canal no válido';
  end if;

  -- Límite de envíos por IP (solo si se manda IP).
  if p_ip is not null and p_ip <> '' then
    v_ventana := to_timestamp(floor(extract(epoch from now()) / (p_minutos_ventana * 60)) * (p_minutos_ventana * 60));
    insert into privado.limite_envios (clave, ventana, conteo) values (p_canal || ':' || p_ip, v_ventana, 1)
    on conflict (clave, ventana) do update set conteo = privado.limite_envios.conteo + 1
    returning conteo into v_conteo;
    delete from privado.limite_envios where ventana < now() - interval '1 day';
    if v_conteo > p_max_por_ventana then
      return jsonb_build_object('resultado', 'limite');
    end if;
  end if;

  insert into public.mensajes (canal, externo_id, remitente_nombre, remitente_contacto, asunto, cuerpo, datos_crudos, creado_por)
  values (p_canal, nullif(p_externo_id, ''), left(p_nombre, 200), left(p_contacto, 200), left(p_asunto, 300),
          left(coalesce(p_cuerpo, ''), 20000), coalesce(p_crudos, '{}'::jsonb), null)
  on conflict on constraint mensajes_externo_unico do nothing
  returning id into v_id;

  if v_id is null then
    return jsonb_build_object('resultado', 'duplicado');
  end if;
  update public.canales_config set ultima_sincronizacion = now() where canal = p_canal;
  return jsonb_build_object('resultado', 'creado', 'id', v_id);
end;
$$;
revoke all on function public.inbox_ingresar(text, text, text, text, text, text, jsonb, text, integer, integer) from public, anon, authenticated;
grant execute on function public.inbox_ingresar(text, text, text, text, text, text, jsonb, text, integer, integer) to service_role;

-- ---------------------------------------------------------------------------
-- Avisos internos (canal "interno")
-- ---------------------------------------------------------------------------
create or replace function privado.crear_mensaje_interno(p_externo_id text, p_asunto text, p_cuerpo text, p_link text)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.mensajes (canal, externo_id, remitente_nombre, asunto, cuerpo, datos_crudos, creado_por)
  values ('interno', p_externo_id, 'Ergon Solutions', p_asunto, coalesce(p_cuerpo, ''), jsonb_build_object('link', p_link), null)
  on conflict on constraint mensajes_externo_unico do nothing;
$$;
revoke all on function privado.crear_mensaje_interno(text, text, text, text) from public, anon, authenticated;

-- Propuesta vista o vencida: además de la notificación, queda en la bandeja.
create or replace function privado.avisar_propuesta(p_id uuid, p_tipo text, p_titulo text, p_cuerpo text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_creador uuid;
  v_vence   timestamptz;
begin
  select creado_por, vence_en into v_creador, v_vence from public.propuestas where id = p_id;
  if v_creador is not null and exists (select 1 from public.perfiles where usuario_id = v_creador) then
    perform privado.notificar(v_creador, p_tipo, p_titulo, p_cuerpo, '/propuestas/' || p_id);
  else
    perform privado.notificar(usuario_id, p_tipo, p_titulo, p_cuerpo, '/propuestas/' || p_id) from public.perfiles;
  end if;
  perform privado.crear_mensaje_interno(
    p_tipo || ':' || p_id || ':' || coalesce(floor(extract(epoch from v_vence))::text, ''),
    p_titulo, p_cuerpo, '/propuestas/' || p_id);
end;
$$;

-- Tareas vencidas: un aviso en la bandeja por tarea (una sola vez).
create or replace function privado.avisos_tareas_vencidas()
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
    select tr.id, tr.titulo, tr.fecha_limite, p.nombre as responsable
    from public.tareas tr left join public.perfiles p on p.usuario_id = tr.responsable_id
    where tr.fecha_limite < v_hoy and tr.estado <> 'hecha'
  loop
    perform privado.crear_mensaje_interno(
      'tarea_vencida:' || t.id, 'Tarea vencida',
      t.titulo || coalesce(' · ' || t.responsable, '') || ' · venció el ' || to_char(t.fecha_limite, 'DD/MM/YYYY'),
      '/proyectos/tareas/' || t.id);
    v_total := v_total + 1;
  end loop;
  return v_total;
end;
$$;
revoke all on function privado.avisos_tareas_vencidas() from public, anon, authenticated;

select cron.schedule('tareas-vencidas-bandeja', '10 14 * * *', $$select privado.avisos_tareas_vencidas()$$);
