# Seguridad

- Todas las tablas de Supabase deben tener RLS habilitado.
- No confiar en `tenant_id` enviado por el cliente; resolverlo desde el host y validar pertenencia en servidor/RPC.
- Las rutas protegidas deben comprobar sesión y rol antes de renderizar o mutar datos.
- Los secretos viven en `.env.local`, Vercel Environment Variables o Supabase Vault.
- Nunca registrar contraseñas de cuentas, tokens, claves Supabase o comprobantes en logs.
- Las contraseñas de inventario se cifran con pgcrypto y solo se descifran dentro de una operación autorizada.
- Las comprobaciones de autorización deben fallar cerrado cuando falten host, sesión, tenant o rol.
