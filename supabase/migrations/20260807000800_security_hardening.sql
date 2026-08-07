drop policy if exists recargas_own_insert on public.recargas;
drop policy if exists recargas_admin_update on public.recargas;
drop policy if exists tenants_admin_update on public.tenants;
drop policy if exists inventario_admin_manage on public.inventario_cuentas;

create policy inventario_admin_read on public.inventario_cuentas
for select using (public.is_tenant_admin(tenant_id));

revoke all on public.inventario_cuentas from authenticated;
grant select (id, tenant_id, producto_id, vendido, vendido_at, venta_id, created_at)
  on public.inventario_cuentas to authenticated;

create or replace function public.crear_recarga(
  p_tenant_id uuid,
  p_monto numeric,
  p_banco_origen text,
  p_referencia text,
  p_comprobante_url text
)
returns public.recargas
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rate numeric(10,2);
  v_recarga public.recargas%rowtype;
begin
  if auth.uid() is null or not public.is_tenant_member(p_tenant_id) then
    raise exception 'Cliente no autorizado';
  end if;
  if p_monto <= 0 then raise exception 'El monto debe ser mayor a cero'; end if;
  if p_referencia is null or length(trim(p_referencia)) = 0 then
    raise exception 'La referencia es obligatoria';
  end if;

  select creditos_por_peso into v_rate
  from public.tenant_config
  where tenant_id = p_tenant_id;
  v_rate := coalesce(v_rate, 1.00);

  insert into public.recargas (tenant_id, user_id, monto, creditos, banco_origen, referencia, comprobante_url, estado, origen)
  values (p_tenant_id, auth.uid(), round(p_monto, 2), round(p_monto * v_rate, 2), p_banco_origen, trim(p_referencia), p_comprobante_url, 'pendiente', 'manual')
  returning * into v_recarga;
  return v_recarga;
end;
$$;

create or replace function public.actualizar_branding_tenant(
  p_tenant_id uuid,
  p_nombre_tienda text,
  p_logo_url text,
  p_color_primario text
)
returns public.tenants
language plpgsql
security definer
set search_path = public
as $$
declare v_tenant public.tenants%rowtype;
begin
  if auth.uid() is null or not public.is_tenant_admin(p_tenant_id) then
    raise exception 'Admin no autorizado';
  end if;
  if p_color_primario !~ '^#[0-9a-fA-F]{6}$' then raise exception 'Color inválido'; end if;

  update public.tenants
  set nombre_tienda = trim(p_nombre_tienda),
      logo_url = nullif(trim(p_logo_url), ''),
      color_primario = lower(p_color_primario)
  where id = p_tenant_id
  returning * into v_tenant;
  if not found then raise exception 'Tenant no encontrado'; end if;
  return v_tenant;
end;
$$;

create or replace function public.audit_critical_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant_id uuid;
  v_entity_id uuid;
begin
  v_tenant_id := case when tg_table_name = 'tenants' then coalesce(new.id, old.id) else coalesce(new.tenant_id, old.tenant_id) end;
  v_entity_id := coalesce(new.id, old.id);
  insert into public.audit_logs (tenant_id, actor_id, accion, entidad, entidad_id, metadata)
  values (
    v_tenant_id,
    auth.uid(),
    lower(tg_op),
    tg_table_name,
    v_entity_id,
    jsonb_build_object('source', 'database_trigger')
  );
  return coalesce(new, old);
end;
$$;

drop trigger if exists audit_tenants on public.tenants;
create trigger audit_tenants after insert or update or delete on public.tenants
for each row execute function public.audit_critical_change();

drop trigger if exists audit_recargas on public.recargas;
create trigger audit_recargas after insert or update or delete on public.recargas
for each row execute function public.audit_critical_change();

drop trigger if exists audit_inventario on public.inventario_cuentas;
create trigger audit_inventario after insert or update or delete on public.inventario_cuentas
for each row execute function public.audit_critical_change();

drop trigger if exists audit_movimientos on public.movimientos_saldo;
create trigger audit_movimientos after insert or update or delete on public.movimientos_saldo
for each row execute function public.audit_critical_change();

drop trigger if exists audit_comisiones on public.comisiones;
create trigger audit_comisiones after insert or update or delete on public.comisiones
for each row execute function public.audit_critical_change();

drop trigger if exists audit_onboarding on public.onboarding_solicitudes;
create trigger audit_onboarding after insert or update or delete on public.onboarding_solicitudes
for each row execute function public.audit_critical_change();

revoke all on function public.crear_recarga(uuid, numeric, text, text, text) from public;
grant execute on function public.crear_recarga(uuid, numeric, text, text, text) to authenticated;
revoke all on function public.actualizar_branding_tenant(uuid, text, text, text) from public;
grant execute on function public.actualizar_branding_tenant(uuid, text, text, text) to authenticated;
revoke all on function public.audit_critical_change() from public;
