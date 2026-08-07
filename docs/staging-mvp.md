# Staging MVP

## Objetivo

Validar todas las fases actuales sin afectar producción ni cuentas reales.

## Rama

```text
staging/mvp
```

## Vercel Environment Variables

Configurar en el entorno `Preview` o `staging`, nunca en el repositorio:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_ROOT_DOMAIN=streamingos.mx
SUPERADMIN_DOMAIN=superadmin.streamingos.mx
SUPERADMIN_EMAIL=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
RESEND_FROM_EMAIL=
ANTHROPIC_API_KEY=
ANTHROPIC_VISION_MODEL=claude-sonnet-4-6
SPEI_WEBHOOK_SECRET=
VERCEL_TOKEN=
VERCEL_PROJECT_ID=
```

Las claves privadas solo se configuran como variables server-side en Vercel.

## Dominios

- Vercel Preview: dominio generado automáticamente.
- Staging opcional: `staging.streamingos.mx`.
- Tenant de pruebas: usar un dominio o slug dedicado, nunca cuentas reales.
- Superadmin: `superadmin.streamingos.mx`.

## Datos de prueba

Crear únicamente:

- Tenant `streamish` o un tenant `staging` separado.
- Usuario superadmin de prueba.
- Usuario vendedor de prueba.
- Usuario cliente de prueba.
- Producto de prueba.
- Cuenta de inventario ficticia/autorizada.
- Saldo y recarga de prueba.

## Checkpoint

```bash
npm test
npm run lint
npm run typecheck
npm run build
supabase db lint --local
```

Después validar registro, login, aislamiento de tenants, carga de inventario, compra, recarga, OCR, webhook y PWA.
