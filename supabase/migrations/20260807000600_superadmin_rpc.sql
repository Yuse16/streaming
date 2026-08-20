create or replace function public.is_superadmin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid()
      and tenant_id is null
      and rol = 'superadmin'
  );
$$;

create or replace function public.superadmin_list_tenants()
returns table (
  id uuid,
  slug text,
  custom_domain text,
  nombre_tienda text,
  activo boolean,
  plan text,
  comision_pct numeric,
  created_at timestamptz,
  ventas_total bigint,
  comisiones_total numeric
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_superadmin() then raise exception 'Superadmin no autorizado'; end if;
  return query
  select t.id, t.slug, t.custom_domain, t.nombre_tienda, t.activo, t.plan, t.comision_pct, t.created_at,
    (select count(*) from public.ventas v where v.tenant_id = t.id),
    coalesce((select sum(c.monto) from public.comisiones c where c.tenant_id = t.id), 0)
  from public.tenants t
  order by t.created_at desc;
end;
$$;

create or replace function public.superadmin_update_tenant(
  p_tenant_id uuid,
  p_activo boolean,
  p_comision_pct numeric,
  p_custom_domain text
)
returns public.tenants
language plpgsql
security definer
set search_path = public
as $$
declare v_tenant public.tenants%rowtype;
begin
  if not public.is_superadmin() then raise exception 'Superadmin no autorizado'; end if;
  if p_comision_pct < 0 or p_comision_pct > 100 then raise exception 'Comisión inválida'; end if;
  update public.tenants
  set activo = p_activo,
      comision_pct = p_comision_pct,
      custom_domain = nullif(lower(trim(p_custom_domain)), '')
  where id = p_tenant_id
  returning * into v_tenant;
  if not found then raise exception 'Tenant no encontrado'; end if;
  insert into public.audit_logs (tenant_id, actor_id, accion, entidad, entidad_id, metadata)
  values (v_tenant.id, auth.uid(), 'actualizar_tenant', 'tenants', v_tenant.id, jsonb_build_object('activo', p_activo, 'custom_domain', p_custom_domain));
  return v_tenant;
end;
$$;

create or replace function public.superadmin_list_onboarding()
returns setof public.onboarding_solicitudes
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_superadmin() then raise exception 'Superadmin no autorizado'; end if;
  return query select * from public.onboarding_solicitudes order by created_at desc;
end;
$$;

create or replace function public.superadmin_review_onboarding(
  p_request_id uuid,
  p_estado text,
  p_nota text
)
returns public.onboarding_solicitudes
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request public.onboarding_solicitudes%rowtype;
begin
  if not public.is_superadmin() then raise exception 'Superadmin no autorizado'; end if;
  if p_estado not in ('aprobada', 'rechazada') then raise exception 'Estado inválido'; end if;
  select * into v_request from public.onboarding_solicitudes where id = p_request_id for update;
  if not found then raise exception 'Solicitud no encontrada'; end if;
  update public.onboarding_solicitudes
  set estado = p_estado, nota = nullif(trim(p_nota), ''), revisada_por = auth.uid(), updated_at = now()
  where id = p_request_id
  returning * into v_request;

  if p_estado = 'aprobada' then
    insert into public.tenants (slug, nombre_tienda, activo)
    values (v_request.slug_deseado, v_request.nombre_comercial, false)
    on conflict (slug) do nothing;
  end if;
  return v_request;
end;
$$;

create or replace function public.superadmin_list_catalog()
returns setof public.catalogo_servicios
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_superadmin() then raise exception 'Superadmin no autorizado'; end if;
  return query select * from public.catalogo_servicios order by nombre;
end;
$$;

create or replace function public.superadmin_upsert_catalog(
  p_id uuid,
  p_nombre text,
  p_slug text,
  p_icono_url text,
  p_activo boolean
)
returns public.catalogo_servicios
language plpgsql
security definer
set search_path = public
as $$
declare v_service public.catalogo_servicios%rowtype;
begin
  if not public.is_superadmin() then raise exception 'Superadmin no autorizado'; end if;
  insert into public.catalogo_servicios (id, nombre, slug, icono_url, activo)
  values (coalesce(p_id, gen_random_uuid()), trim(p_nombre), lower(trim(p_slug)), nullif(trim(p_icono_url), ''), p_activo)
  on conflict (id) do update set nombre = excluded.nombre, slug = excluded.slug, icono_url = excluded.icono_url, activo = excluded.activo
  returning * into v_service;
  return v_service;
end;
$$;

create or replace function public.superadmin_list_commissions()
returns table (tenant_id uuid, tenant_name text, total numeric, pending numeric, collected numeric)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_superadmin() then raise exception 'Superadmin no autorizado'; end if;
  return query
  select t.id, t.nombre_tienda, coalesce(sum(c.monto), 0), coalesce(sum(c.monto) filter (where not c.cobrada), 0), coalesce(sum(c.monto) filter (where c.cobrada), 0)
  from public.tenants t left join public.comisiones c on c.tenant_id = t.id
  group by t.id, t.nombre_tienda order by t.nombre_tienda;
end;
$$;

create or replace function public.superadmin_mark_commissions_collected(p_tenant_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare v_count integer;
begin
  if not public.is_superadmin() then raise exception 'Superadmin no autorizado'; end if;
  update public.comisiones set cobrada = true where tenant_id = p_tenant_id and not cobrada;
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.is_superadmin() from public;
grant execute on function public.is_superadmin() to authenticated;
revoke all on function public.superadmin_list_tenants() from public;
grant execute on function public.superadmin_list_tenants() to authenticated;
revoke all on function public.superadmin_update_tenant(uuid, boolean, numeric, text) from public;
grant execute on function public.superadmin_update_tenant(uuid, boolean, numeric, text) to authenticated;
revoke all on function public.superadmin_list_onboarding() from public;
grant execute on function public.superadmin_list_onboarding() to authenticated;
revoke all on function public.superadmin_review_onboarding(uuid, text, text) from public;
grant execute on function public.superadmin_review_onboarding(uuid, text, text) to authenticated;
revoke all on function public.superadmin_list_catalog() from public;
grant execute on function public.superadmin_list_catalog() to authenticated;
revoke all on function public.superadmin_upsert_catalog(uuid, text, text, text, boolean) from public;
grant execute on function public.superadmin_upsert_catalog(uuid, text, text, text, boolean) to authenticated;
revoke all on function public.superadmin_list_commissions() from public;
grant execute on function public.superadmin_list_commissions() to authenticated;
revoke all on function public.superadmin_mark_commissions_collected(uuid) from public;
grant execute on function public.superadmin_mark_commissions_collected(uuid) to authenticated;
