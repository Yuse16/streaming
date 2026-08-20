# Multi-Tenant White-Label con Dominios Personalizados — Next.js + Vercel

## Configuración en Vercel

Agregar el dominio del núcleo y los dominios de cada tenant en el proyecto:
```
streamingos.mx  →  proyecto en Vercel (núcleo)
streamish.mx    →  proyecto en Vercel (tenant)
streammax.mx    →  proyecto en Vercel (tenant)
```

En DNS del dominio:
```
A     streamish.mx        → IP de Vercel
CNAME *.streamish.mx      → cname.vercel-dns.com
```

## Middleware de Next.js

```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const subdomain = hostname.split('.')[0]

  // Excluir dominios del sistema
  const systemDomains = ['www', 'superadmin', 'streamingos']
  if (systemDomains.includes(subdomain)) {
    return NextResponse.next()
  }

  // Inyectar el slug del tenant en headers para usarlo en server components
  const response = NextResponse.next()
  response.headers.set('x-tenant-slug', subdomain)
  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

## Resolver tenant en Server Components

```typescript
// lib/tenant.ts
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export async function getCurrentTenant() {
  const headersList = headers()
  const slug = headersList.get('x-tenant-slug')

  if (!slug) return null

  const supabase = createClient()
  const { data: tenant } = await supabase
    .from('tenants')
    .select('*')
    .eq('slug', slug)
    .eq('activo', true)
    .single()

  return tenant
}
```

## Tabla `tenants` en Supabase

```sql
create table tenants (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,           -- identificador interno
  custom_domain text unique,           -- 'streamish.mx'
  nombre_tienda text not null,
  logo_url text,
  color_primario text default '#6366f1',
  plan text default 'basico',          -- basico | pro | enterprise
  activo boolean default true,
  comision_pct numeric(5,2) default 0.00,   -- se configura después mediante acuerdo
  created_at timestamptz default now()
);
```

## Personalización por tenant

Cada tenant puede configurar:
- Nombre de su tienda
- Logo
- Color primario (para la tienda del cliente)
- Métodos de pago aceptados
- Mensaje de bienvenida
- Instrucciones de transferencia bancaria

Esto se almacena en tabla `tenant_config` y se carga en el layout del subdominio.

## Onboarding de nuevo tenant

1. Vendedor llena formulario en `streamish.mx/registro`
2. Se crea registro en `tenants` con `activo = false`
3. Superadmin lo revisa y activa desde su panel
4. Sistema envía instrucciones de acceso al vendedor
5. Vendedor ya puede acceder a `suslug.streamish.mx/admin`

> **Fase 2:** Automatizar el onboarding con pago de suscripción mensual.
