# PRODUCTION_CHECKLIST.md — Validación final de producción

Checklist manual que Jorge debe ejecutar para verificar que StreamingOS funciona en producción
real, una vez aplicados `VERCEL_SETUP.md` y `DNS_SETUP.md`.

---

## 0. Pre-requisitos (antes de empezar)

- [ ] Variables de entorno configuradas en Vercel scope **Production** (ver `VERCEL_SETUP.md`).
- [ ] Un deployment de **Production** existe y está `Ready` (no solo Preview).
- [ ] `streamish.mx` resuelve a `76.76.21.21` (registro A aplicado y propagado, ver `DNS_SETUP.md`).
- [ ] El dominio aparece como **Valid** en Vercel → Settings → Domains (certificado TLS emitido).
- [ ] El tenant `streamish` tiene `custom_domain = streamish.mx` en Supabase (tabla `tenants`).
- [ ] La migración inicial y las subsecuentes están aplicadas en el proyecto remoto
      (`npx supabase migration list` no muestra pendientes).
- [ ] El superadmin accede con `superadmin.streamingos.mx` (o el valor de `SUPERADMIN_DOMAIN`).

---

## 1. Registro de cliente

- [ ] Abrir `https://streamish.mx/registro` en modo incógnito.
- [ ] Crear una cuenta nueva (email real + contraseña).
- [ ] Confirmar que el email de verificación llega (si está configurado Resend).
- [ ] Hacer login y verificar que el header del tenant muestra el nombre de la tienda.
- [ ] Verificar en Supabase que el usuario quedó asociado al tenant correcto y con saldo inicial.
- [ ] **Nuevo:** el mismo flujo no debe crear el usuario en el tenant equivocado si se prueba
      desde otro dominio tenant.

## 2. Compra (flujo end-to-end)

- [ ] El catálogo de `streamish.mx` muestra los productos activos con stock.
- [ ] Comprar un producto (p. ej. Netflix) con el cliente del paso 1.
- [ ] Confirmar que:
  - El saldo se descuenta correctamente (RPC `procesar_compra`).
  - La cuenta del inventario se marca como vendida.
  - La credencial se muestra en la pantalla de éxito con botón copiar.
  - El trigger desactiva el producto si el stock llega a 0.
- [ ] Verificar en `/mis-compras` que aparece el historial con la credencial.
- [ ] Verificar que el email con credenciales llega (si Resend está configurado).

## 3. Recarga (con comprobante)

- [ ] Ir a `/recargar`, registrar una solicitud: monto, banco origen, referencia y comprobante.
- [ ] Verificar que el comprobante subió a Supabase Storage (bucket `comprobantes`) y la recarga
      quedó en estado `pendiente`.
- [ ] En el **panel vendedor**, ver la recarga pendiente, revisar el comprobante y aprobar.
- [ ] Verificar que el saldo del cliente se acredita con la RPC correcta y aparece el movimiento.
- [ ] Verificar que un cliente no puede ver el comprobante de otro (RLS en Storage).

## 4. Panel vendedor

- [ ] Iniciar sesión con un usuario con rol `admin_tenant` (vendedor) del tenant `streamish`.
- [ ] Revisar el dashboard: métricas de ventas del día, stock bajo y sin stock.
- [ ] Inventario: activar/desactivar un producto; cargar cuentas manualmente (formato
      `correo:contraseña`) y verificar que se cifran en `inventario_cuentas`.
- [ ] Clientes: ver la lista, el saldo y agregar créditos manualmente.
- [ ] Ventas: ver el historial y exportar CSV.
- [ ] Recargas: aprobar una recarga de prueba y verificar el flujo completo.
- [ ] **Aislamiento:** verificar que los datos del panel no muestran datos de otros tenants.

## 5. Superadmin

- [ ] Acceder al panel superadmin desde `superadmin.streamingos.mx` (o `SUPERADMIN_DOMAIN`).
- [ ] Dashboard global: ver tenants activos, ventas totales y comisiones.
- [ ] Tenants: ver el tenant `streamish`, su estado, plan y % de comisión.
- [ ] Onboarding: crear una solicitud de onboarding desde el formulario público y aprobarla;
      verificar que se crea el tenant con su vendedor.
- [ ] Catálogo global: crear/editar un servicio (p. ej. Netflix, Disney+).
- [ ] Comisiones: ver el resumen por tenant.
- [ ] **Suspender tenant:** suspender `streamish` y verificar que la tienda muestra el mensaje de
      "servicio no disponible"; reactivarlo después.

## 6. PWA y mobile

- [ ] En un celular Android con Chrome: abrir `https://streamish.mx`, instalar la PWA y verificar
      que abre como app standalone.
- [ ] En iOS Safari: abrir, agregar a pantalla de inicio y verificar funcionamiento básico.
- [ ] Activar modo avión y verificar que la página `/offline` se muestra útil.
- [ ] Lighthouse PWA score > 80 (devtools → Lighthouse → PWA).

## 7. Seguridad

- [ ] Verificar en Supabase que **todas** las tablas tienen RLS activo.
- [ ] Verificar que `SUPABASE_SERVICE_ROLE_KEY` no aparece en el bundle del cliente
      (buscar `service_role` en el source de la página).
- [ ] Probar el webhook SPEI con un payload firmado con `SPEI_WEBHOOK_SECRET` (HMAC) y uno sin
      firmar (debe rechazar el no firmado).
- [ ] Confirmar que los logs del servidor no muestran secretos ni tokens.

---

## 8. Resultado de `npm audit` (deuda técnica conocida)

Se ejecutó `npm audit fix --force` y **rompió el build** (`withPWA is not a function`, porque
fuerza downgrade de `next-pwa@5.6.0 → 2.0.2`, Next 14 → 16 y vitest 2 → 4). Se revirtió. Luego
`npm audit fix` (sin `--force`) redujo de 16 a **15 vulnerabilidades** sin romper nada.

**Estado: 15 vulnerabilidades (3 moderate, 11 high, 1 critical).** Las fixes reales requieren
**breaking changes incompatibles con el build actual**:

| Vulnerabilidad | Severidad | Paquete | Fix (breaking) | Por qué no se aplica |
|---|---|---|---|---|
| `vitest` (UI server file read/execute) | critical | `vitest@2` | vitest@4 | Solo afecta al dev server de tests, no a producción; vitest 4 es breaking |
| `next` (múltiples DoS/XSS/cache-poisoning) | high | `next@14.2.35` | next@16 | Next 16 rompe `next-pwa` y requiere React 19; migración mayor |
| `next-pwa` → `workbox-build` → `rollup-plugin-terser` → `serialize-javascript` (RCE) | high | cadena build de PWA | next-pwa@2.0.2 | Downgrade breaking que rompe el build (`withPWA is not a function`) |
| `postcss` (XSS/path traversal) | high | transitiva de next | next@16 | Depende de la migración de Next |
| `eslint-config-next`/`@next/eslint-plugin-next` → `glob` (command injection) | high | devDeps | eslint-config-next@16 | Requiere Next 16 |
| `vite`/`esbuild` | moderate | devDeps de vitest | vitest@4 | Dev-only; depende de migración de vitest |

**Acción recomendada:** programar una sesión dedicada de migración a Next 16 + React 19 +
reemplazo de `next-pwa` (por `@ducanh2912/next-pwa` o web manifest nativo) antes de producción
pública con datos reales. No es bloqueante para el checklist funcional de arriba, pero sí es deuda
de seguridad de alta prioridad.

---

## Resultado final

Después de completar todos los ítems, marcar:

- [ ] Todos los flujos funcionales (1–6) pasan.
- [ ] Seguridad (7) validada.
- [ ] Deuda de npm audit (8) documentada y con plan de migración agendado.
- [ ] Deploy final de producción aprobado y estable (revisar logs de Vercel).