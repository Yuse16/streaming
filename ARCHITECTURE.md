# Arquitectura

Streamish es una aplicación Next.js 14 con App Router, Supabase Auth/Postgres/Storage y despliegue en Vercel.

## Contextos

- `streamish.mx`: landing y onboarding.
- `[slug].streamish.mx`: tienda y sesión del cliente.
- `[slug].streamish.mx/admin`: panel del vendedor.
- `admin.streamish.mx`: panel superadmin.

## Resolución de tenant

`middleware.ts` obtiene el slug desde el host y lo coloca en `x-tenant-slug`. Los Server Components resuelven el tenant activo mediante `lib/tenant.ts`. La identidad del usuario y su rol se validan con Supabase Auth y `user_roles`.

## Límites

- `app/`: rutas, layouts y páginas.
- `lib/`: integraciones y lógica reutilizable.
- `supabase/migrations/`: schema, RLS y funciones SQL.
- `streamvault-docs/`: especificación funcional del producto.

Las mutaciones autenticadas se ejecutan en Server Actions o Route Handlers, validan con Zod y respetan el tenant de la request.
