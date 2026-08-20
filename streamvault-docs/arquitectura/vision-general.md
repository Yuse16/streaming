# Arquitectura General — StreamingOS

## Diagrama de alto nivel

```
┌─────────────────────────────────────────────────────────────┐
│                  streamingos.mx (núcleo)                   │
│          Superadmin + registro de nuevos tenants             │
└──────────────────────────┬──────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
   streamish.mx       streammax.mx       cuentasflix.com
  (Tenant A)         (Tenant B)         (Tenant C)
        │
        ├── /tienda          ← clientes compran aquí
        ├── /admin           ← panel del vendedor (Pepe)
        └── /api             ← rutas Next.js del tenant
                           │
                    Supabase (compartido)
                    row-level security por tenant_id
```

## Cómo se resuelve el tenant

1. Request llega a un dominio personalizado como `streamish.mx`
2. Middleware de Next.js extrae el host completo
3. Busca en tabla `tenants` el registro con `custom_domain = 'streamish.mx'`
4. Inyecta el tenant en el contexto de la request
5. Todas las queries de Supabase filtran por ese `tenant_id`

## Separación de contextos

| Contexto | URL | Quién accede |
|---|---|---|
| Superadmin | `superadmin.streamingos.mx` | Solo tú |
| Panel vendedor | `*.streamish.mx/admin` | El dueño del subdominio |
| Tienda | `*.streamish.mx/` | Clientes del vendedor |
| API interna | `*.streamish.mx/api/*` | Next.js server actions |

## Flujo de datos principal

```
Cliente → Tienda → Compra →
  → Descuenta créditos del cliente
  → Entrega credenciales del inventario
  → Marca cuenta como vendida
  → Calcula comisión del superadmin
  → Notifica al vendedor
```

## Consideraciones de seguridad

- Las contraseñas de streaming se guardan cifradas en Supabase (pgcrypto)
- Row Level Security (RLS) garantiza que tenant A no vea datos de tenant B
- Las credenciales solo se revelan al cliente en el momento exacto de la compra
- Logs de auditoría para cada entrega de credenciales
