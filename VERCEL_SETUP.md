# VERCEL_SETUP.md — Variables de entorno para Producción

Guía para configurar el **scope Production** del proyecto Vercel `streaming-li25`
(org `jorge-dlp-s-projects`) para dejar StreamingOS en producción real.

> Estado actual: las variables solo existen en **Preview** (scoped a `feat/production-hardening`
> y globales). **Production no tiene ninguna variable**, por lo que un deployment de producción
> fallaría en runtime. Este documento las lista en el orden en que debes agregarlas.

---

## Cómo agregarlas en Vercel

1. Ir a https://vercel.com/jorge-dlp-s-projects/streaming-li25/settings/environment-variables
2. Para cada variable: **Add New** → nombre + valor → Environments: marcar **Production**
   (y opcionalmente Preview/Development si las quieres compartidas).
3. Los valores marcados **Sensitive** quedan ocultos una vez guardados (no se pueden leer después).
4. Después de agregarlas, un nuevo **Deployment de Production** las inyecta. Las variables
   `NEXT_PUBLIC_*` se embeben en el build: **requieren redeploy** para aplicarse.

---

## Listado completo para Production

### 1. Supabase (obligatorio — la app no arranca sin estas)

| Variable | Valor (no secreto) | Sensitive | Notas |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://rzvdsxanbhdhlqllrwhx.supabase.co` | No | URL del proyecto de producción. Se lee en `lib/supabase/{client,server}.ts` y `middleware.ts`. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | *(pegar del panel Supabase → Settings → API Keys → anon `public`)* | No | Clave pública (anon). Prefijo típico `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`. |
| `SUPABASE_SERVICE_ROLE_KEY` | *(pegar del panel Supabase → Settings → API Keys → service_role)* | **Sí** | Solo server-side. Se usa en `lib/supabase/admin.ts`. **Nunca exponer al cliente.** |

### 2. Multi-tenancy y superadmin

| Variable | Valor | Sensitive | Notas |
|---|---|---|---|
| `SUPERADMIN_DOMAIN` | `superadmin.streamingos.mx` | No | Dominio exacto del panel superadmin. Se lee en `lib/tenant-host.ts` (`isSuperadminHost`). |

> **Definidas pero sin uso activo en el código actual:** `NEXT_PUBLIC_ROOT_DOMAIN` y
> `SUPERADMIN_EMAIL` existen en `.env.example` y en Preview, pero el código de esta rama no las
> lee (verificado con grep). Puedes configurarlas igualmente para uso futuro o por consistencia:
> - `NEXT_PUBLIC_ROOT_DOMAIN` = `streamingos.mx`
> - `SUPERADMIN_EMAIL` = *(email del superadmin, e.g. `enriquedlpchaires@gmail.com`)*

### 3. Recargas automáticas (webhook SPEI)

| Variable | Valor | Sensitive | Notas |
|---|---|---|---|
| `SPEI_WEBHOOK_SECRET` | *(generar: `openssl rand -hex 32`)* | **Sí** | Se valida con HMAC en `app/api/webhooks/spei/route.ts`. Debe coincidir con el secreto configurado en el sistema bancario que envía el webhook. |

### 4. Email (Resend)

| Variable | Valor | Sensitive | Notas |
|---|---|---|---|
| `RESEND_API_KEY` | *(del dashboard de Resend)* | **Sí** | Envío de credenciales y emails de auth en `lib/auth/actions.ts`. |
| `RESEND_FROM_EMAIL` | `StreamingOS <noreply@streamingos.mx>` | No | Remitente verificado en Resend. |

### 5. OCR con fallback a Claude Vision (opcional)

| Variable | Valor | Sensitive | Notas |
|---|---|---|---|
| `ANTHROPIC_API_KEY` | *(del console de Anthropic)* | **Sí** | Activa el fallback cuando Tesseract da confianza < 70% en `lib/ocr.ts`. |
| `ANTHROPIC_VISION_MODEL` | `claude-sonnet-4-6` | No | Modelo de visión (valor por defecto si se omite). |

### 6. Automatización de dominios (Vercel) — opcional para el superadmin

| Variable | Valor | Sensitive | Notas |
|---|---|---|---|
| `VERCEL_TOKEN` | *(token personal de Vercel → Account Settings → Tokens)* | **Sí** | Usado en `lib/superadmin-actions.ts` para automatizar dominios. |
| `VERCEL_PROJECT_ID` | `prj_BEfL9dzOH2u1CRBOVWeo2SyLi8eW` | No | ID del proyecto `streaming-li25` (ya vinculado). |

---

## Resumen rápido (checklist)

Obligatorias para producción funcional:
1. `NEXT_PUBLIC_SUPABASE_URL`
2. `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. `SUPABASE_SERVICE_ROLE_KEY`
4. `SUPERADMIN_DOMAIN`
5. `SPEI_WEBHOOK_SECRET`

Recomendadas:
6. `RESEND_API_KEY`
7. `RESEND_FROM_EMAIL`
8. `VERCEL_PROJECT_ID`

Opcionales:
9. `ANTHROPIC_API_KEY` + `ANTHROPIC_VISION_MODEL`
10. `VERCEL_TOKEN`
11. `NEXT_PUBLIC_ROOT_DOMAIN` + `SUPERADMIN_EMAIL` (sin uso activo actual)

> **Importante:** tras agregarlas, ejecuta un deployment de producción. Verifica que el
> deployment **Production** aparezca en la lista de deployments (el actual solo tiene Preview).