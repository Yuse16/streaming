# Runtime

## Request lifecycle

1. Vercel recibe la request.
2. `middleware.ts` clasifica host, dominio tenant y rutas.
3. Supabase SSR sincroniza cookies de sesión.
4. La página o acción resuelve el tenant desde `x-tenant-slug`.
5. Las rutas protegidas redirigen a `/login` si no existe sesión válida.

El runtime debe funcionar en `slug.localhost:3000`, en dominios personalizados como `streamish.mx` y en `superadmin.streamingos.mx`, sin depender de una clave service role en el cliente.
