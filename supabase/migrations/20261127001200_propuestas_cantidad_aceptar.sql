-- Propuestas: cantidad por concepto, IVA en el link público y "Aceptar" desde el link.

alter table public.propuesta_conceptos
  add column cantidad integer not null default 1 check (cantidad between 1 and 999);

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
    total_instalacion = coalesce((select sum(precio_instalacion * cantidad) from public.propuesta_conceptos where propuesta_id = v_id), 0),
    total_mensual     = coalesce((select sum(precio_mensual * cantidad) from public.propuesta_conceptos where propuesta_id = v_id), 0)
  where p.id = v_id;
  if tg_op = 'UPDATE' and old.propuesta_id <> new.propuesta_id then
    update public.propuestas p set
      total_instalacion = coalesce((select sum(precio_instalacion * cantidad) from public.propuesta_conceptos where propuesta_id = old.propuesta_id), 0),
      total_mensual     = coalesce((select sum(precio_mensual * cantidad) from public.propuesta_conceptos where propuesta_id = old.propuesta_id), 0)
    where p.id = old.propuesta_id;
  end if;
  return null;
end;
$$;
revoke all on function privado.recalcular_totales_propuesta() from public, anon, authenticated;

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
      'con_iva', p.con_iva,
      'creado_en', p.creado_en
    ),
    'conceptos', coalesce((
      select jsonb_agg(jsonb_build_object(
        'titulo', c.titulo, 'descripcion', c.descripcion, 'cantidad', c.cantidad,
        'precio_instalacion', c.precio_instalacion, 'precio_mensual', c.precio_mensual
      ) order by c.orden)
      from public.propuesta_conceptos c where c.propuesta_id = p.id
    ), '[]'::jsonb)
  );
end;
$$;
revoke all on function public.propuesta_publica(text, boolean) from public;
grant execute on function public.propuesta_publica(text, boolean) to anon, authenticated;

-- El prospecto acepta desde su link. Solo funciona con el token exacto y si la
-- propuesta sigue vigente (enviada o vista). Avisa a quien la creó.
create or replace function public.aceptar_propuesta_publica(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  p public.propuestas%rowtype;
begin
  if p_token is null or length(p_token) < 32 then
    return jsonb_build_object('ok', false);
  end if;
  select * into p from public.propuestas
   where token_publico = p_token and not archivada and estado in ('enviada', 'vista')
     and (vence_en is null or vence_en >= now());
  if not found then
    return jsonb_build_object('ok', false);
  end if;
  update public.propuestas set estado = 'aceptada', respondida_en = now() where id = p.id;
  perform privado.avisar_propuesta(p.id, 'propuesta_aceptada', 'Propuesta aceptada',
    p.folio || ' · ' || p.prospecto_nombre || ' la aceptó desde su link.');
  return jsonb_build_object('ok', true);
end;
$$;
revoke all on function public.aceptar_propuesta_publica(text) from public;
grant execute on function public.aceptar_propuesta_publica(text) to anon, authenticated;
