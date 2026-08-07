insert into storage.buckets (id, name, public)
values ('comprobantes', 'comprobantes', false)
on conflict (id) do update set public = false;

alter function public.procesar_compra(uuid, uuid, uuid)
set search_path = public, extensions;

create policy comprobantes_client_upload on storage.objects
for insert to authenticated
with check (
  bucket_id = 'comprobantes'
  and (storage.foldername(name))[1] = auth.uid()::text
  and exists (
    select 1 from public.clientes_tenant
    where user_id = auth.uid()
      and tenant_id::text = (storage.foldername(name))[2]
      and activo = true
  )
);

create policy comprobantes_client_read on storage.objects
for select to authenticated
using (
  bucket_id = 'comprobantes'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or exists (
      select 1 from public.tenants
      where id::text = (storage.foldername(name))[2]
        and public.is_tenant_admin(id)
    )
  )
);

create policy comprobantes_client_delete on storage.objects
for delete to authenticated
using (
  bucket_id = 'comprobantes'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create or replace function public.obtener_mis_compras(p_tenant_id uuid)
returns table (
  venta_id uuid,
  servicio text,
  correo text,
  password text,
  precio numeric,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if auth.uid() is null then
    raise exception 'Usuario no autenticado';
  end if;

  if not public.is_tenant_member(p_tenant_id) then
    raise exception 'Cliente no pertenece a este tenant';
  end if;

  return query
  select
    v.id,
    cs.nombre,
    ic.correo,
    pgp_sym_decrypt(ic.password_enc::bytea, public.get_inventory_encryption_key()),
    v.precio,
    v.created_at
  from public.ventas v
  join public.inventario_cuentas ic on ic.id = v.cuenta_id
  join public.productos p on p.id = v.producto_id
  join public.catalogo_servicios cs on cs.id = p.servicio_id
  where v.user_id = auth.uid()
    and v.tenant_id = p_tenant_id
  order by v.created_at desc;
end;
$$;

revoke all on function public.obtener_mis_compras(uuid) from public;
grant execute on function public.obtener_mis_compras(uuid) to authenticated;
