# Kernel

El Kernel contiene contratos que no deben romperse entre fases:

- Identidad técnica: `auth.users.id`.
- Roles: `superadmin`, `admin_tenant`, `cliente`.
- Tenant activo: slug local o dominio personalizado resuelto desde el host y validado contra `tenants.activo`.
- Autorización: sesión + rol + tenant; nunca solo el slug enviado por el cliente.
- Datos críticos: RLS y RPC SQL son la última frontera de autorización.

La Sesión 3 agrega autenticación sin cambiar el schema de la Sesión 2.
