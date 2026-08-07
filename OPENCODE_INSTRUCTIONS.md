# StreamingOS — Instrucciones para OpenCode

> Este archivo es el contexto maestro del proyecto. Léelo completo al inicio de cada sesión.
> Actualiza la sección "Estado actual" al terminar cada sesión antes de cerrar.

---

## Qué es este proyecto

**StreamingOS** es el núcleo SaaS multi-tenant white-label para vendedores de cuentas de streaming.
Cada tenant puede operar con su propia marca y dominio personalizado, por ejemplo `streamish.mx`.
El cliente final ve la marca del tenant, no StreamingOS. Es una PWA construida con Next.js + Supabase.

**Documentación completa:** `/streamvault-docs/` (arquitectura, módulos, schema, flujos)

---

## Stack

- **Framework:** Next.js 14 (App Router) — TypeScript estricto
- **Base de datos:** Supabase (Postgres + Auth + Storage + RLS)
- **Hosting:** Vercel (un proyecto con dominios personalizados por tenant)
- **PWA:** `next-pwa` con service worker y manifest por tenant
- **Estilos:** Tailwind CSS
- **OCR:** Tesseract.js (Fase 2: fallback a Claude Vision API)
- **Email:** Resend
- **Validación:** Zod
- **Estado global:** Zustand (solo donde sea necesario, preferir server components)

---

## Reglas de trabajo obligatorias

### Git
1. **Nunca trabajes en `main` directamente**
2. Cada sesión = una rama: `feat/nombre-descriptivo` o `fix/nombre`
3. Commits en español, descriptivos: `feat: agregar modal de carga de cuentas por imagen`
4. Al terminar la sesión: push de la rama + PR listo para revisar
5. Jorge hace merge a `main` después de probar en preview de Vercel

### Calidad de código
- TypeScript sin `any` — si no sabes el tipo, investiga el correcto
- Cada server action valida con Zod antes de tocar la DB
- No dejes `console.log` en código que va a producción (usa solo en dev)
- Manejo de errores explícito — nunca `catch(e) { }` vacío
- Nombrar funciones y variables en inglés, comentarios en español cuando sea complejo

### Supabase
- Toda lógica crítica de negocio (compra, débito de créditos) va en funciones SQL (RPC), no en JS
- Usar `for update skip locked` en queries que tomen inventario
- Activar RLS en TODAS las tablas — nunca dejarla desactivada en producción
- Las migrations van en `/supabase/migrations/` con timestamp en el nombre

### Archivos sensibles
- Las variables de entorno van solo en `.env.local` (gitignoreado)
- Nunca hardcodear keys, slugs de tenant, ni UUIDs en el código
- El `SUPABASE_SERVICE_ROLE_KEY` solo se usa en server-side, nunca en el cliente

---

## Estructura de carpetas

```
streamingos/
├── app/
│   ├── (superadmin)/          ← rutas del superadmin (superadmin.streamingos.mx)
│   │   └── admin/
│   ├── (tenant)/              ← rutas de cualquier dominio tenant
│   │   ├── page.tsx           ← home / catálogo
│   │   ├── tienda/
│   │   ├── recargar/
│   │   └── mis-compras/
│   ├── (vendor)/              ← rutas del panel del vendedor
│   │   └── admin/
│   └── api/
│       └── webhooks/
├── components/
│   ├── ui/                    ← componentes base (shadcn/ui)
│   ├── tenant/                ← componentes específicos del tenant
│   ├── vendor/                ← componentes del panel vendedor
│   └── superadmin/            ← componentes del superadmin
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   ├── tenant.ts              ← resolver de tenant desde subdominio
│   ├── ocr.ts                 ← lógica de extracción de cuentas
│   └── utils.ts
├── supabase/
│   └── migrations/
├── docs/                      ← documentación del proyecto (los .md)
├── public/
│   ├── manifest.json
│   └── icons/
├── middleware.ts              ← resolver de subdominio → tenant_id
└── OPENCODE_INSTRUCTIONS.md  ← este archivo
```

---

## Fases y sesiones de trabajo

### FASE 1 — Fundación (MVP funcional)

---

#### SESIÓN 1 — Setup del proyecto
**Rama:** `feat/setup-inicial`

**Tareas:**
- [ ] Inicializar proyecto Next.js 14 con TypeScript, Tailwind, App Router
- [ ] Instalar dependencias: `next-pwa`, `@supabase/ssr`, `zod`, `resend`, `zustand`, `shadcn/ui`
- [ ] Configurar `next.config.js` con next-pwa (service worker + manifest)
- [ ] Crear `middleware.ts` para resolver subdominio → tenant_id y pasar en header `x-tenant-slug`
- [ ] Crear `lib/supabase/client.ts`, `server.ts`, `middleware.ts` (el cliente de Supabase)
- [ ] Crear `lib/tenant.ts` — función `getCurrentTenant()` que lee el header y busca en DB
- [ ] Crear `public/manifest.json` base (nombre dinámico se sobreescribirá por tenant en Fase 2)
- [ ] Variables de entorno documentadas en `.env.example`
- [ ] Push + PR

**Checkpoint antes de continuar:**
- `npm run dev` corre sin errores
- Acceder a `localhost:3000` con header manual `x-tenant-slug: test` no rompe la app
- Middleware resuelve el subdominio correctamente en los logs

---

#### SESIÓN 2 — Schema de base de datos
**Rama:** `feat/database-schema`

**Tareas:**
- [ ] Crear migration inicial con TODAS las tablas del schema (ver `docs/base-de-datos/schema.md`)
  - `tenants`, `tenant_config`, `catalogo_servicios`, `productos`
  - `inventario_cuentas`, `clientes_tenant`, `saldos_clientes`
  - `movimientos_saldo`, `recargas`, `ventas`, `comisiones`
- [ ] Habilitar `pgcrypto` en Supabase
- [ ] Crear función SQL `procesar_compra` (ver schema.md — es crítica, es atómica)
- [ ] Crear trigger `trg_update_product_status` (activa/desactiva producto por stock)
- [ ] Activar RLS en todas las tablas + policies base
- [ ] Insertar datos seed: catálogo de servicios (Netflix, Disney+, HBO Max, Paramount+, Crunchyroll, Star+)
- [ ] Push + PR

**Checkpoint antes de continuar:**
- Correr migration en Supabase local sin errores
- Verificar en Supabase Studio que todas las tablas existen con sus columnas
- Insertar un tenant de prueba manualmente y verificar que RLS lo aísla

---

#### SESIÓN 3 — Autenticación y resolución de tenant
**Rama:** `feat/auth-multitenant`

**Tareas:**
- [ ] Configurar Supabase Auth (email/password)
- [ ] Página `/login` para clientes del tenant — usa el tenant_id del subdominio
- [ ] Página `/registro` para clientes del tenant
- [ ] Recuperación de contraseña
- [ ] Protección de rutas con middleware: `/tienda/*`, `/mis-compras`, `/recargar`, `/perfil`
- [ ] Protección de rutas del vendor: `*/admin/*` — verificar que el usuario es owner del tenant
- [ ] Protección del superadmin: `superadmin.streamingos.mx/*` — verificar rol superadmin
- [ ] Tabla `user_roles` o columna en tenant para identificar roles
- [ ] Push + PR

**Checkpoint antes de continuar:**
- Cliente puede registrarse y hacer login en `slug.localhost:3000`
- Rutas protegidas redirigen a login si no hay sesión
- Un usuario de tenant A no puede acceder a rutas de tenant B

---

#### SESIÓN 4 — Tienda del cliente (frontend)
**Rama:** `feat/tienda-cliente`

**Tareas:**
- [ ] Layout base del tenant: lee `tenant_config` y aplica colores como CSS vars, logo en header
- [ ] Página home `/` — catálogo de productos activos del tenant (grid con imagen del servicio, precio, stock)
- [ ] Página `/tienda` (protegida) — misma vista pero con saldo del usuario en header
- [ ] Componente `ProductCard` — imagen del servicio, nombre, precio, botón comprar
- [ ] Productos con `estado = 'sin_stock'` se muestran con badge "Agotado" o se ocultan según config del tenant
- [ ] Página `/tienda/[producto_id]` — confirmación de compra (resumen + botón confirmar)
- [ ] Integrar Server Action `comprarCuenta` con la función RPC de Supabase
- [ ] Pantalla de éxito: mostrar credenciales + botón copiar
- [ ] Email automático al cliente con credenciales (Resend)
- [ ] Push + PR

**Checkpoint antes de continuar:**
- Con un tenant de prueba y cuentas cargadas manualmente en DB, completar una compra end-to-end
- Verificar que la cuenta queda marcada como vendida en DB
- Verificar que el saldo se descuenta correctamente
- Verificar que el trigger desactiva el producto cuando stock llega a 0

---

#### SESIÓN 5 — Páginas del cliente (perfil, historial, recarga)
**Rama:** `feat/cliente-pages`

**Tareas:**
- [ ] Página `/mis-compras` — historial con correo, contraseña (siempre visible), fecha
- [ ] Página `/recargar`:
  - Mostrar instrucciones bancarias del tenant (CLABE, banco, titular)
  - Formulario de solicitud: monto, banco origen, referencia, subir comprobante
  - Upload de imagen a Supabase Storage (bucket `comprobantes`, acceso privado)
  - Guardar en tabla `recargas` con estado `pendiente`
  - Lista de solicitudes previas con su estado
- [ ] Página `/perfil` — datos personales + cambiar contraseña
- [ ] Mostrar saldo en todo el layout del tenant una vez autenticado
- [ ] Push + PR

**Checkpoint antes de continuar:**
- Completar solicitud de recarga con imagen, verificar que aparece en DB con URL de Storage
- Verificar que un cliente no puede ver comprobantes de otro cliente (RLS en Storage)
- El historial de compras muestra las credenciales correctas

---

#### SESIÓN 6 — Panel del Vendedor
**Rama:** `feat/panel-vendedor`

**Tareas:**
- [ ] Layout del panel admin (`/admin`) con sidebar: Dashboard, Inventario, Clientes, Recargas, Ventas, Config
- [ ] Dashboard: métricas básicas (ventas del día, stock bajo, productos sin stock)
- [ ] Página Inventario: lista de productos del tenant con estado y stock count
  - Activar / desactivar manualmente un producto
  - Botón "Cargar cuentas" por producto
- [ ] Modal "Cargar cuentas" — método manual (textarea `correo:contraseña` línea por línea)
  - Parser en tiempo real: preview de cuentas detectadas mientras escribe
  - Validación de formato
  - Confirmar → insertar en `inventario_cuentas` cifradas
- [ ] Página Recargas Pendientes: lista con datos del cliente, monto, referencia, ver comprobante
  - Botón Aprobar → acredita créditos + cambia estado
  - Botón Rechazar → pide motivo + notifica al cliente
- [ ] Página Clientes: lista, saldo, historial, agregar créditos manualmente
- [ ] Página Ventas: historial con filtros, exportar CSV
- [ ] Push + PR

**Checkpoint antes de continuar:**
- Completar flujo completo: cargar cuentas → cliente compra → vendedor ve la venta
- Aprobar una recarga manualmente → cliente ve créditos actualizados
- Los datos del panel A no son visibles desde el panel B

---

#### SESIÓN 7 — Panel Superadmin
**Rama:** `feat/superadmin`

**Tareas:**
- [ ] Setup de dominio `superadmin.streamingos.mx` — ruta separada en middleware
- [ ] Auth del superadmin (usuario especial con rol `superadmin` en DB)
- [ ] Dashboard global: tenants activos, ventas totales, comisiones acumuladas
- [ ] Página Tenants: tabla con todos los tenants, estado, plan, comisión %
  - Activar / Suspender tenant
  - Ver detalle (ventas, clientes)
  - Editar % de comisión
- [ ] Página Solicitudes de Onboarding: aprobar / rechazar nuevos vendedores
- [ ] Catálogo Global de Servicios: CRUD de Netflix, Disney+, etc. con íconos
- [ ] Página Comisiones: resumen por tenant, marcar como cobrado
- [ ] Push + PR

**Checkpoint antes de continuar:**
- Superadmin puede activar un tenant nuevo y el vendedor puede hacer login
- Al suspender un tenant, su tienda muestra página de "servicio no disponible"
- Las comisiones se calculan correctamente en el reporte

---

#### SESIÓN 8 — PWA completa + pulido
**Rama:** `feat/pwa-pulido`

**Tareas:**
- [ ] Manifest dinámico por tenant: `/api/manifest` que genera el JSON con nombre y colores del tenant
- [ ] Service worker con estrategia cache-first para assets estáticos
- [ ] Offline page (`/offline`) — si no hay conexión, mostrar mensaje útil
- [ ] Íconos PWA (192x192, 512x512) por tenant (generar dinámicamente con colores del tenant o usar genérico)
- [ ] Meta tags para PWA en el `<head>` del layout del tenant
- [ ] Probar instalación en Android (Chrome) y iOS (Safari)
- [ ] Formulario de onboarding para nuevos tenants en `streamish.mx/registro`
- [ ] Landing page básica en `streamish.mx` explicando el servicio
- [ ] Revisión general de UX: estados de carga, mensajes de error, empty states
- [ ] Push + PR

**Checkpoint antes de continuar:**
- Instalar la PWA en un celular Android — debe funcionar como app
- Instalar en iOS — debe funcionar sin errores críticos
- Lighthouse PWA score > 80

---

### FASE 2 — Automatización (después de MVP en producción)

Estas sesiones se planifican cuando la Fase 1 esté en producción y con usuarios reales.

#### SESIÓN 9 — OCR para carga de cuentas por imagen
**Rama:** `feat/ocr-image-upload`

- Integrar Tesseract.js en server action
- Si Tesseract falla (score < 70% confianza) → fallback a Claude Vision API
- Modal actualizado con opción "Subir imagen"
- Preview + edición antes de confirmar

#### SESIÓN 10 — Automatización de recargas
**Rama:** `feat/recargas-automaticas`

- Evaluar CoDi vs webhook SPEI vs bot WhatsApp según el banco del tenant
- Implementar la opción más viable como primera integración
- El panel del vendedor muestra "recargas auto-aprobadas" vs "manuales"

---

## Estado actual del proyecto

> **ACTUALIZAR AL FINAL DE CADA SESIÓN**

```
Última sesión completada: SESIÓN 10 — Automatización de recargas
Rama actual: feat/recargas-automaticas
Próxima sesión: (MVP automatizado; siguiente prioridad: pruebas de producción)

Notas para la próxima sesión:
- Repositorio: https://github.com/Yuse16/streaming
- StreamingOS es el núcleo; Streamish es el primer tenant con dominio `streamish.mx`
- Proyecto Supabase de producción creado
- La migración inicial está aplicada en Supabase local y remoto
- Vault contiene el secreto `inventory_encryption_key`
- Docker ejecuta Supabase local en puertos alternos `55421`-`55424` porque otro proyecto usa los puertos estándar
- La autenticación está implementada localmente; falta validación manual end-to-end con un usuario de prueba
- El catálogo, detalle y compra RPC están implementados; falta completar una compra end-to-end con inventario de prueba
- Perfil, historial y recargas están implementados; la migración de Storage/RPC está validada localmente y pendiente de aplicar remotamente
- La migración white-label agrega `tenants.custom_domain`; falta aplicarla remotamente
- El panel del vendedor está implementado; falta validación manual con usuario admin, inventario y recarga real
- El panel superadmin está implementado; falta validación manual con rol superadmin y migraciones remotas
- Manifest dinámico, service worker, offline y onboarding white-label están implementados; falta prueba de instalación móvil y Lighthouse
- OCR Tesseract, fallback opcional Claude Vision y preview editable están implementados; requiere configurar `ANTHROPIC_API_KEY` para activar el fallback
- Webhook SPEI agnóstico implementado con HMAC, idempotencia y conciliación RPC; requiere configurar `SUPABASE_SERVICE_ROLE_KEY` y `SPEI_WEBHOOK_SECRET`
```

---

## Variables de entorno necesarias

```env
# .env.local (nunca al repositorio)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=       # solo server-side
# La clave de inventario se guarda en Supabase Vault, nunca en el repositorio.
RESEND_API_KEY=
NEXT_PUBLIC_ROOT_DOMAIN=streamingos.mx
SUPERADMIN_DOMAIN=superadmin.streamingos.mx
SUPERADMIN_EMAIL=                # tu email como superadmin
VERCEL_TOKEN=                    # solo server-side para automatizar dominios
VERCEL_PROJECT_ID=
```

---

## Comandos útiles

```bash
# Desarrollo
npm run dev

# Supabase local
npx supabase start
npx supabase db reset             # aplica migrations desde cero
npx supabase migration new nombre # crea nueva migration

# Simular subdominios en local
# Agregar en /etc/hosts:
# 127.0.0.1 test.localhost
# 127.0.0.1 admin.localhost
# Luego acceder a test.localhost:3000

# Build y verificación pre-PR
npm run build
npm run lint
npx tsc --noEmit
```

---

## Regla final

Al terminar cada sesión, antes de hacer push:
1. Correr `npm run build` — si falla, no hacer push
2. Correr `npx tsc --noEmit` — cero errores de TypeScript
3. Actualizar la sección "Estado actual" de este archivo
4. Hacer push de la rama y crear el PR con descripción de lo que se hizo y el checkpoint de pruebas

Si en algún punto una decisión de arquitectura entra en conflicto con estas instrucciones,
**no cambies las instrucciones sin consultarlo con Jorge primero.**
