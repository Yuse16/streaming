create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant_id uuid;
begin
  v_tenant_id := nullif(new.raw_user_meta_data ->> 'tenant_id', '')::uuid;

  if v_tenant_id is null then
    return new;
  end if;

  if not exists (
    select 1 from public.tenants
    where id = v_tenant_id and activo = true
  ) then
    raise exception 'Tenant no disponible';
  end if;

  insert into public.clientes_tenant (tenant_id, user_id)
  values (v_tenant_id, new.id)
  on conflict (tenant_id, user_id) do nothing;

  insert into public.saldos_clientes (tenant_id, user_id)
  values (v_tenant_id, new.id)
  on conflict (tenant_id, user_id) do nothing;

  insert into public.user_roles (tenant_id, user_id, rol)
  values (v_tenant_id, new.id, 'cliente')
  on conflict (tenant_id, user_id, rol) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

create policy user_roles_own_read on public.user_roles
for select using (user_id = auth.uid());

revoke all on function public.handle_new_auth_user() from public;
