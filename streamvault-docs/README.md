# StreamingOS — Núcleo SaaS White-Label

## Qué es

StreamingOS es el núcleo multi-tenant donde cada vendedor opera con su propia marca y dominio personalizado. Streamish (`streamish.mx`) es el primer tenant configurado. La comisión de la plataforma queda desactivada inicialmente.

## Estructura del sistema

```
streamingos/
├── README.md                        ← este archivo
├── arquitectura/
│   ├── vision-general.md            ← diagrama de alto nivel, roles, flujos
│   └── multi-tenant.md              ← cómo funciona el subdominio por tenant
├── modulos/
│   ├── panel-vendedor.md            ← admin del vendedor (su panel interno)
│   ├── panel-superadmin.md          ← tu panel como operador de la plataforma
│   ├── tienda-cliente.md            ← experiencia del comprador
│   ├── inventario-ocr.md            ← flujo de carga de cuentas por imagen
│   └── creditos-pagos.md            ← sistema de créditos + transferencias
├── flujos/
│   ├── flujo-compra.md              ← cliente compra una cuenta paso a paso
│   ├── flujo-carga-inventario.md    ← vendedor sube nuevas cuentas
│   └── flujo-recarga-creditos.md    ← cliente paga y recibe créditos
├── base-de-datos/
│   └── schema.md                    ← tablas Supabase, relaciones, RLS
└── saas/
    └── modelo-negocio.md            ← comisiones, onboarding de tenants, precios
```

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 14 (App Router) |
| Backend / DB | Supabase (Postgres + Auth + Storage) |
| OCR | Tesseract.js o Claude Vision API |
| Hosting | Vercel (dominios personalizados por tenant) |
| Pagos | Transferencia manual → créditos (fase 1) |
| Notificaciones | WhatsApp Business API o webhooks (fase 2) |

## Roles del sistema

| Rol | Descripción |
|---|---|
| **Superadmin** | Tú. Gestiona tenants, ve comisiones globales, activa/desactiva planes |
| **Admin Tenant** | El vendedor. Gestiona su tienda, inventario, clientes y créditos |
| **Cliente** | Comprador final. Se registra en el subdominio del vendedor |

## Fases del proyecto

- **Fase 1 (MVP):** Carga manual de cuentas, créditos por transferencia manual, tienda funcional
- **Fase 2:** OCR para carga de cuentas por imagen, validación automática de transferencias
- **Fase 3:** API de pagos alternativa (SPEI directo, CoDi, o similar sin comisiones altas)
