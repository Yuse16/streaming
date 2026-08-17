create or replace function public.audit_critical_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_record jsonb;
  v_tenant_id uuid;
  v_entity_id uuid;
begin
  v_record := to_jsonb(coalesce(new, old));
  v_tenant_id := case
    when tg_table_name = 'tenants' and tg_op = 'DELETE' then null
    when tg_table_name = 'tenants' then nullif(v_record->>'id', '')::uuid
    else nullif(v_record->>'tenant_id', '')::uuid
  end;
  v_entity_id := nullif(v_record->>'id', '')::uuid;
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