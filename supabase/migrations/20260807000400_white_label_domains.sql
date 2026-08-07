alter table public.tenants
  add column if not exists custom_domain text;

create unique index if not exists tenants_custom_domain_unique
  on public.tenants (lower(custom_domain))
  where custom_domain is not null;

alter table public.tenants
  add constraint tenants_custom_domain_format
  check (
    custom_domain is null
    or custom_domain = lower(custom_domain)
  );
