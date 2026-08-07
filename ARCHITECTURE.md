# Arquitectura

StreamingOS es una aplicación Next.js 14 con App Router, Supabase Auth/Postgres/Storage y despliegue en un proyecto Vercel white-label.

## Contextos

- `streamingos.mx`: landing y núcleo.
- `streamish.mx`: primer dominio personalizado de tenant.
- `*.localhost`: resolución de tenants durante desarrollo.
- `superadmin.streamingos.mx`: panel superadmin.
- `[custom-domain]/admin`: panel del vendedor del tenant.

## Resolución de tenant

`middleware.ts` clasifica el host: usa `x-tenant-slug` en local, `x-tenant-domain` para dominios personalizados y `x-context=superadmin` para el núcleo. Los Server Components resuelven el tenant activo mediante `lib/tenant.ts`. La identidad del usuario y su rol se validan con Supabase Auth y `user_roles`.

## Límites

- `app/`: rutas, layouts y páginas.
- `lib/`: integraciones y lógica reutilizable.
- `supabase/migrations/`: schema, RLS y funciones SQL.
- `streamvault-docs/`: especificación funcional del producto.

Las mutaciones autenticadas se ejecutan en Server Actions o Route Handlers, validan con Zod y respetan el tenant de la request.
