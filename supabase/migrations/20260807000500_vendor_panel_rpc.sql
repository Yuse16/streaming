create policy tenant_config_admin_update on public.tenant_config
for all using (public.is_tenant_admin(tenant_id)) with check (public.is_tenant_admin(tenant_id));

create policy tenants_admin_update on public.tenants
for update using (public.is_tenant_admin(id) or owner_id = auth.uid())
with check (public.is_tenant_admin(id) or owner_id = auth.uid());

create or replace function public.insertar_inventario_cuentas(
  p_tenant_id uuid,
  p_producto_id uuid,
  p_cuentas jsonb
)
returns integer
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_item jsonb;
  v_inserted integer := 0;
begin
  if auth.uid() is null or not public.is_tenant_admin(p_tenant_id) then
    raise exception 'Admin no autorizado';
  end if;

  if not exists (
    select 1 from public.productos
    where id = p_producto_id and tenant_id = p_tenant_id
  ) then
    raise exception 'Producto no pertenece al tenant';
  end if;

  for v_item in select value from jsonb_array_elements(p_cuentas)
  loop
    if length(trim(v_item ->> 'correo')) = 0 or length(v_item ->> 'password') < 4 then
      raise exception 'Cuenta inválida';
    end if;

    insert into public.inventario_cuentas (tenant_id, producto_id, correo, password_enc)
    values (
      p_tenant_id,
      p_producto_id,
      lower(trim(v_item ->> 'correo')),
      extensions.pgp_sym_encrypt(v_item ->> 'password', public.get_inventory_encryption_key())
    )
    on conflict do nothing;
    if found then v_inserted := v_inserted + 1; end if;
  end loop;

  return v_inserted;
end;
$$;

create or replace function public.rechazar_recarga(
  p_recarga_id uuid,
  p_admin_id uuid,
  p_nota text
)
returns public.recargas
language plpgsql
security definer
set search_path = public
as $$
declare
  v_recarga public.recargas%rowtype;
begin
  if auth.uid() is null or auth.uid() <> p_admin_id then
    raise exception 'Usuario no autorizado';
  end if;

  select * into v_recarga from public.recargas where id = p_recarga_id for update;
  if not found or not public.is_tenant_admin(v_recarga.tenant_id) then
    raise exception 'Recarga no autorizada';
  end if;
  if v_recarga.estado <> 'pendiente' then raise exception 'La recarga ya fue procesada'; end if;

  update public.recargas
  set estado = 'rechazada', nota_rechazo = nullif(trim(p_nota), ''), updated_at = now()
  where id = p_recarga_id
  returning * into v_recarga;
  return v_recarga;
end;
$$;

create or replace function public.ajustar_saldo(
  p_tenant_id uuid,
  p_user_id uuid,
  p_creditos numeric,
  p_nota text,
  p_admin_id uuid
)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  v_saldo numeric;
begin
  if auth.uid() is null or auth.uid() <> p_admin_id or not public.is_tenant_admin(p_tenant_id) then
    raise exception 'Admin no autorizado';
  end if;
  if p_creditos = 0 then raise exception 'El ajuste no puede ser cero'; end if;

  insert into public.saldos_clientes (tenant_id, user_id, saldo)
  values (p_tenant_id, p_user_id, p_creditos)
  on conflict (tenant_id, user_id) do update
    set saldo = public.saldos_clientes.saldo + excluded.saldo, updated_at = now()
  returning saldo into v_saldo;

  if v_saldo < 0 then raise exception 'El saldo no puede ser negativo'; end if;

  insert into public.movimientos_saldo (tenant_id, user_id, tipo, monto, nota)
  values (p_tenant_id, p_user_id, 'ajuste', p_creditos, p_nota);
  return v_saldo;
end;
$$;

revoke all on function public.insertar_inventario_cuentas(uuid, uuid, jsonb) from public;
grant execute on function public.insertar_inventario_cuentas(uuid, uuid, jsonb) to authenticated;
revoke all on function public.rechazar_recarga(uuid, uuid, text) from public;
grant execute on function public.rechazar_recarga(uuid, uuid, text) to authenticated;
revoke all on function public.ajustar_saldo(uuid, uuid, numeric, text, uuid) from public;
grant execute on function public.ajustar_saldo(uuid, uuid, numeric, text, uuid) to authenticated;
