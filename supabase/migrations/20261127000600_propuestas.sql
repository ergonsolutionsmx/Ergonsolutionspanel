-- Fase 5 · Propuestas

-- Contador de folios por año: ES-2026-001, ES-2026-002…
create table privado.folios (
  serie  text not null,
  anio   integer not null,
  ultimo integer not null default 0,
  primary key (serie, anio)
);
revoke all on privado.folios from public, anon, authenticated;

create or replace function privado.siguiente_folio(p_serie text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_anio integer := extract(year from (now() at time zone 'America/Mexico_City'))::integer;
  v_num  integer;
begin
  insert into privado.folios (serie, anio, ultimo) values (p_serie, v_anio, 1)
  on conflict (serie, anio) do update set ultimo = privado.folios.ultimo + 1
  returning ultimo into v_num;
  return p_serie || '-' || v_anio || '-' || lpad(v_num::text, 3, '0');
end;
$$;
revoke all on function privado.siguiente_folio(text) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- propuestas
-- ---------------------------------------------------------------------------
create table public.propuestas (
  id                 uuid primary key default gen_random_uuid(),
  folio              text not null unique,
  prospecto_nombre   text not null check (length(trim(prospecto_nombre)) > 0),
  prospecto_negocio  text,
  prospecto_contacto text,
  problema           text,
  solucion           text,
  notas              text,  -- internas: no salen en el PDF ni en el link
  estado             text not null default 'borrador'
                     check (estado in ('borrador', 'enviada', 'vista', 'aceptada', 'rechazada', 'vencida')),
  token_publico      text not null unique default encode(extensions.gen_random_bytes(24), 'hex'),
  enviada_en         timestamptz,
  vence_en           timestamptz,
  vista_en           timestamptz,
  respondida_en      timestamptz,
  total_instalacion  numeric(12, 2) not null default 0,
  total_mensual      numeric(12, 2) not null default 0,
  archivada          boolean not null default false,
  -- cliente_id: se agregará cuando exista el CRM.
  creado_en          timestamptz not null default now(),
  actualizado_en     timestamptz not null default now(),
  creado_por         uuid references auth.users (id) on delete set null default auth.uid()
);

create index propuestas_estado_idx on public.propuestas (estado, vence_en);

create or replace function privado.propuestas_folio()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.folio is null or new.folio = '' then
    new.folio := privado.siguiente_folio('ES');
  end if;
  return new;
end;
$$;
revoke all on function privado.propuestas_folio() from public, anon, authenticated;

create trigger propuestas_folio before insert on public.propuestas
  for each row execute function privado.propuestas_folio();
create trigger propuestas_actualizado_en before update on public.propuestas
  for each row execute function public.tocar_actualizado_en();
create trigger propuestas_bitacora after insert or update or delete on public.propuestas
  for each row execute function public.registrar_bitacora();

alter table public.propuestas enable row level security;
create policy "miembros leen propuestas" on public.propuestas
  for select to authenticated using ((select privado.es_miembro()));
create policy "miembros crean propuestas" on public.propuestas
  for insert to authenticated with check ((select privado.es_miembro()));
create policy "miembros editan propuestas" on public.propuestas
  for update to authenticated using ((select privado.es_miembro())) with check ((select privado.es_miembro()));
-- Solo se borran borradores; lo demás se archiva.
create policy "miembros borran borradores" on public.propuestas
  for delete to authenticated using ((select privado.es_miembro()) and estado = 'borrador');

-- Desde la app solo se editan estas columnas: el folio, el token y los totales
-- no se tocan (los totales los calcula la base de datos).
revoke update on public.propuestas from authenticated;
grant update (prospecto_nombre, prospecto_negocio, prospecto_contacto, problema, solucion, notas,
              estado, enviada_en, vence_en, vista_en, respondida_en, archivada)
  on public.propuestas to authenticated;

-- ---------------------------------------------------------------------------
-- propuesta_conceptos
-- ---------------------------------------------------------------------------
create table public.propuesta_conceptos (
  id                 uuid primary key default gen_random_uuid(),
  propuesta_id       uuid not null references public.propuestas (id) on delete cascade,
  servicio_id        uuid references public.servicios (id) on delete set null,
  variante_id        uuid references public.servicio_variantes (id) on delete set null,
  titulo             text not null check (length(trim(titulo)) > 0),
  descripcion        text,
  precio_instalacion numeric(12, 2) check (precio_instalacion is null or precio_instalacion >= 0),  -- null = por definir
  precio_mensual     numeric(12, 2) check (precio_mensual is null or precio_mensual >= 0),
  orden              double precision not null default extract(epoch from clock_timestamp()),
  creado_en          timestamptz not null default now(),
  actualizado_en     timestamptz not null default now(),
  creado_por         uuid references auth.users (id) on delete set null default auth.uid()
);

create index propuesta_conceptos_propuesta_idx on public.propuesta_conceptos (propuesta_id, orden);

create trigger propuesta_conceptos_actualizado_en before update on public.propuesta_conceptos
  for each row execute function public.tocar_actualizado_en();
create trigger propuesta_conceptos_bitacora after insert or update or delete on public.propuesta_conceptos
  for each row execute function public.registrar_bitacora();

-- Totales siempre calculados desde los conceptos.
create or replace function privado.recalcular_totales_propuesta()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid := coalesce(new.propuesta_id, old.propuesta_id);
begin
  update public.propuestas p set
    total_instalacion = coalesce((select sum(precio_instalacion) from public.propuesta_conceptos where propuesta_id = v_id), 0),
    total_mensual     = coalesce((select sum(precio_mensual) from public.propuesta_conceptos where propuesta_id = v_id), 0)
  where p.id = v_id;
  if tg_op = 'UPDATE' and old.propuesta_id <> new.propuesta_id then
    update public.propuestas p set
      total_instalacion = coalesce((select sum(precio_instalacion) from public.propuesta_conceptos where propuesta_id = old.propuesta_id), 0),
      total_mensual     = coalesce((select sum(precio_mensual) from public.propuesta_conceptos where propuesta_id = old.propuesta_id), 0)
    where p.id = old.propuesta_id;
  end if;
  return null;
end;
$$;
revoke all on function privado.recalcular_totales_propuesta() from public, anon, authenticated;

create trigger propuesta_conceptos_totales
  after insert or update or delete on public.propuesta_conceptos
  for each row execute function privado.recalcular_totales_propuesta();

alter table public.propuesta_conceptos enable row level security;
create policy "miembros leen conceptos" on public.propuesta_conceptos
  for select to authenticated using ((select privado.es_miembro()));
create policy "miembros crean conceptos" on public.propuesta_conceptos
  for insert to authenticated with check ((select privado.es_miembro()));
create policy "miembros editan conceptos" on public.propuesta_conceptos
  for update to authenticated using ((select privado.es_miembro())) with check ((select privado.es_miembro()));
create policy "miembros borran conceptos" on public.propuesta_conceptos
  for delete to authenticated using ((select privado.es_miembro()));

-- ---------------------------------------------------------------------------
-- Link público /p/[token]
-- ---------------------------------------------------------------------------
-- Única puerta de entrada sin sesión: con el token exacto devuelve SOLO lo que
-- se muestra al prospecto (sin notas internas). Si p_marcar_vista, la primera
-- apertura marca "vista" y avisa a quien la creó.
create or replace function public.propuesta_publica(p_token text, p_marcar_vista boolean default true)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  p public.propuestas%rowtype;
begin
  if p_token is null or length(p_token) < 32 then
    return jsonb_build_object('estado', 'no_existe');
  end if;

  select * into p from public.propuestas where token_publico = p_token and not archivada;
  if not found or p.estado = 'borrador' then
    return jsonb_build_object('estado', 'no_existe');
  end if;

  -- Vencida (por fecha o por estado): no se muestra el contenido.
  if p.estado = 'vencida' or (p.vence_en is not null and p.vence_en < now() and p.estado in ('enviada', 'vista')) then
    return jsonb_build_object('estado', 'vencida', 'folio', p.folio);
  end if;

  if p_marcar_vista and p.vista_en is null and p.estado = 'enviada' then
    update public.propuestas set estado = 'vista', vista_en = now() where id = p.id;
    perform privado.avisar_propuesta(p.id, 'propuesta_vista', 'Propuesta vista',
      p.folio || ' · ' || p.prospecto_nombre || ' la abrió.');
    p.estado := 'vista';
  end if;

  return jsonb_build_object(
    'estado', 'ok',
    'propuesta', jsonb_build_object(
      'folio', p.folio,
      'estado', p.estado,
      'prospecto_nombre', p.prospecto_nombre,
      'prospecto_negocio', p.prospecto_negocio,
      'problema', p.problema,
      'solucion', p.solucion,
      'enviada_en', p.enviada_en,
      'vence_en', p.vence_en,
      'total_instalacion', p.total_instalacion,
      'total_mensual', p.total_mensual,
      'creado_en', p.creado_en
    ),
    'conceptos', coalesce((
      select jsonb_agg(jsonb_build_object(
        'titulo', c.titulo, 'descripcion', c.descripcion,
        'precio_instalacion', c.precio_instalacion, 'precio_mensual', c.precio_mensual
      ) order by c.orden)
      from public.propuesta_conceptos c where c.propuesta_id = p.id
    ), '[]'::jsonb)
  );
end;
$$;

-- Avisa a quien creó la propuesta (o a los dos si no hay creador).
create or replace function privado.avisar_propuesta(p_id uuid, p_tipo text, p_titulo text, p_cuerpo text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_creador uuid;
begin
  select creado_por into v_creador from public.propuestas where id = p_id;
  if v_creador is not null and exists (select 1 from public.perfiles where usuario_id = v_creador) then
    perform privado.notificar(v_creador, p_tipo, p_titulo, p_cuerpo, '/propuestas/' || p_id);
  else
    perform privado.notificar(usuario_id, p_tipo, p_titulo, p_cuerpo, '/propuestas/' || p_id) from public.perfiles;
  end if;
end;
$$;
revoke all on function privado.avisar_propuesta(uuid, text, text, text) from public, anon, authenticated;

revoke all on function public.propuesta_publica(text, boolean) from public;
grant execute on function public.propuesta_publica(text, boolean) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Vencimiento diario (8:05 a. m. CDMX): marcar vencidas y avisar.
-- ---------------------------------------------------------------------------
create or replace function privado.vencer_propuestas()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  r record;
  v_total integer := 0;
begin
  for r in
    update public.propuestas set estado = 'vencida'
    where estado in ('enviada', 'vista') and vence_en < now() and not archivada
    returning id, folio, prospecto_nombre
  loop
    perform privado.avisar_propuesta(r.id, 'propuesta_vencida', 'Propuesta vencida',
      r.folio || ' · ' || r.prospecto_nombre || '. Puedes renovarla 30 días.');
    v_total := v_total + 1;
  end loop;
  return v_total;
end;
$$;
revoke all on function privado.vencer_propuestas() from public, anon, authenticated;

select cron.schedule('propuestas-vencidas', '5 14 * * *', $$select privado.vencer_propuestas()$$);
