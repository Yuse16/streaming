# Modelo de Negocio — StreamingOS SaaS

## Cómo ganas dinero

Tienes dos fuentes de ingreso:

### 1. Comisión por venta (principal)
- La comisión queda desactivada en el MVP inicial (`comision_pct = 0`)
- Se habilitará posteriormente mediante un acuerdo con cada vendedor
- Sin cobros manuales — el sistema lo calcula solo

### 2. Suscripción mensual por tenant (posterior al MVP)
- Plan básico: acceso a la plataforma + X% comisión
- Plan pro: más productos, OCR incluido, % de comisión menor
- Cobro por transferencia o cuando el tenant acumula suficientes ventas

---

## Planes sugeridos

| Plan | Precio/mes | Comisión StreamingOS | Productos activos | OCR |
|---|---|---|---|---|
| **Básico** | Gratis | 12% | 5 productos | ❌ |
| **Pro** | $299 MXN | 8% | Ilimitado | ✅ |
| **Enterprise** | Negociable | 5% | Ilimitado | ✅ + soporte |

> Los planes, precios y porcentajes quedan fuera del MVP inicial.

---

## Onboarding de un nuevo vendedor

```
1. Vendedor llena formulario en streamish.mx/registro:
   - Nombre / alias comercial
   - Subdominio deseado (slug)
   - Email
   - WhatsApp
   - A qué servicios se dedica

2. Tú recibes notificación en tu superadmin

3. Revisas y apruebas (o rechazas) en 1 clic

4. Al aprobar:
   - Se crea tenant con slug asignado
   - Se crea usuario admin para el vendedor
   - Se envía email con credenciales y guía de inicio

5. Vendedor entra a su-slug.streamish.mx/admin
   - Completa configuración: logo, colores, datos bancarios
   - Activa los servicios que vende del catálogo
   - Carga sus primeras cuentas
   - Comparte su URL con sus clientes

6. Primera venta → se registra la venta; cualquier comisión queda desactivada inicialmente
```

---

## Ventajas que vendes al vendedor

| Sin StreamingOS | Con StreamingOS |
|---|---|
| Vende por WhatsApp, manual | Tienda propia con URL |
| Inventario en Excel o de memoria | Sistema automático de stock |
| Entrega cuenta a mano | Entrega instantánea al pagar |
| No sabe cuánto vendió | Dashboard con métricas |
| Carga cuentas copiando una a una | Carga masiva por imagen |
| Clientes no saben el saldo | Panel del cliente con saldo y historial |

---

## Argumentos de venta al vendedor

1. **Profesionaliza tu negocio** — ya no vendes por WhatsApp, tienes tu propia tienda
2. **Ahorra tiempo** — la plataforma entrega las cuentas automáticamente
3. **Escala sin esfuerzo** — puedes tener 100 clientes comprando a la vez
4. **Control total** — sabes exactamente cuánto tienes de stock y cuánto has vendido
5. **Sin comisiones absurdas** — no es Mercado Pago, el dinero llega directo a ti

---

## Métricas clave a monitorear (superadmin)

- **MRR** (ingresos recurrentes mensuales) — si implementas suscripción
- **GMV** (Gross Merchandise Volume) — total de ventas en la plataforma
- **Comisión total** — tu take rate sobre el GMV
- **Tenants activos** — cuántos están vendiendo activamente
- **Churn de tenants** — cuántos abandonan cada mes
- **Ticket promedio** — precio promedio de compra por cliente

---

## Roadmap de crecimiento

### Fase 1 — MVP (1-2 meses)
- [ ] Multi-tenant con subdominios
- [ ] Panel vendedor básico
- [ ] Tienda del cliente
- [ ] Carga manual de cuentas
- [ ] Créditos con validación manual
- [ ] Superadmin básico

### Fase 2 — Automatización (2-4 meses)
- [ ] OCR para carga de cuentas por imagen
- [ ] Bot WhatsApp para validar recargas
- [ ] Notificaciones por email automáticas
- [ ] Métricas avanzadas en dashboard

### Fase 3 — Escala (4-6 meses)
- [ ] SPEI automático (CoDi o intermediario)
- [ ] Planes y suscripciones con cobro automático
- [ ] API pública para integraciones
- [ ] App móvil (PWA optimizada)
- [ ] Soporte a más categorías (gift cards, licencias, VPN)
