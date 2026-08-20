# Desarrollo

## Requisitos

- Node.js 20 LTS.
- Docker Desktop para Supabase local.
- Supabase CLI autenticada para aplicar migraciones remotas.

## Comandos

```bash
npm install
npm run dev
npm run lint
npm run typecheck
npm run build
supabase start
supabase db reset
supabase db lint --local
```

## Verificación por incremento

Antes de crear cada commit se ejecutan lint, typecheck, tests y build. Si no existe una suite de tests, debe crearse al implementar la primera lógica testeable; no se considera suficiente omitir la verificación.

## Configuración local

Las variables van en `.env.local`, nunca en Git. Los puertos locales de Supabase están configurados en `supabase/config.toml` para no interferir con otro proyecto local.
