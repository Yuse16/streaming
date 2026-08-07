# Decisiones

## D-001: Multi-tenant por subdominio

El tenant se resuelve desde `[slug].streamish.mx` y se propaga mediante `x-tenant-slug`.

## D-002: Supabase como backend

Auth, Postgres, Storage y RLS se centralizan en Supabase. La clave service role solo puede usarse server-side.

## D-003: Identidad interna

La identidad técnica usa `auth.users.id` como `user_id`. La tabla `user_roles` relaciona usuarios con tenants y roles.

## D-004: Comisión inicial

La comisión está desactivada en el MVP y `tenants.comision_pct` inicia en `0.00`. Se habilitará mediante acuerdo posterior.

## D-005: Alcance actual

La siguiente fase es autenticación y resolución de tenant. No se implementan todavía tienda completa, paneles, OCR, pagos automáticos ni PWA completa.
