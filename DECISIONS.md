# Decisiones

## D-001: StreamingOS como núcleo white-label

El repositorio y la aplicación base se llaman StreamingOS. Streamish es un tenant configurable, no el nombre del motor.

## D-002: Multi-tenant por dominio

En desarrollo se usa `slug.localhost`; en producción el tenant se resuelve por `tenants.custom_domain` y se propaga mediante `x-tenant-domain`.

## D-003: Supabase como backend

Auth, Postgres, Storage y RLS se centralizan en Supabase. La clave service role solo puede usarse server-side.

## D-004: Identidad interna

La identidad técnica usa `auth.users.id` como `user_id`. La tabla `user_roles` relaciona usuarios con tenants y roles.

## D-005: Comisión inicial

La comisión está desactivada en el MVP y `tenants.comision_pct` inicia en `0.00`. Se habilitará mediante acuerdo posterior.

## D-006: Alcance actual

La siguiente fase es autenticación y resolución de tenant. No se implementan todavía tienda completa, paneles, OCR, pagos automáticos ni PWA completa.
