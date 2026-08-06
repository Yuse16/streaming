# Módulo: Créditos y Pagos

## Concepto

StreamVault no procesa pagos directamente. Usa un sistema de créditos prepagados:
1. Cliente transfiere dinero al vendedor (SPEI / transferencia bancaria)
2. Vendedor valida la transferencia y aprueba la recarga
3. El sistema acredita créditos al cliente
4. El cliente usa los créditos para comprar cuentas

**Ventaja:** cero comisiones de pasarela. El dinero va directo al vendedor.
**Desventaja:** requiere validación manual (automatizable en Fase 2).

## Equivalencia de créditos

Cada tenant define su propia equivalencia, sugerida:
```
1 crédito = $1 MXN
```

Precio del producto en la tienda: "Disney+ — 65 créditos"

## Flujo de recarga (Fase 1 — Manual)

```
Cliente                          Vendedor
   │                                │
   ├─ Solicita recarga ($200)        │
   ├─ Ve instrucciones de pago       │
   ├─ Hace transferencia SPEI        │
   ├─ Sube comprobante en la app ───►│
   │                                 ├─ Ve solicitud en "Recargas pendientes"
   │                                 ├─ Verifica en su banca
   │                                 ├─ Aprueba o rechaza
   │◄──────────────── créditos acreditados
   ├─ Recibe notificación
   └─ Puede comprar
```

## Tabla de solicitudes de recarga

```sql
create table recargas (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id),
   user_id uuid references auth.users(id),
  monto numeric(10,2) not null,       -- en pesos MXN
  creditos numeric(10,2) not null,    -- calculado por equivalencia del tenant
  banco_origen text,
  referencia text,
  comprobante_url text,               -- imagen en Supabase Storage
  estado text default 'pendiente',    -- pendiente | aprobada | rechazada
  nota_rechazo text,
  aprobada_por uuid,                  -- user_id del admin que aprobó
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

## Tabla de saldo del cliente

```sql
create table saldos_clientes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id),
   user_id uuid references auth.users(id),
  saldo numeric(10,2) default 0,
  updated_at timestamptz default now(),
   unique(tenant_id, user_id)
);
```

## Movimientos de saldo (ledger)

Siempre registrar cada movimiento, nunca solo actualizar el saldo:

```sql
create table movimientos_saldo (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id),
   user_id uuid references auth.users(id),
   tipo text not null,         -- recarga | compra | reembolso | ajuste
  monto numeric(10,2) not null,  -- positivo = entrada, negativo = salida
  referencia_id uuid,         -- id de la recarga o venta relacionada
  nota text,
  created_at timestamptz default now()
);
```

## Fase 2 — Automatización (opciones sin Mercado Pago)

### Opción A: SPEI con webhook (CONEKTA o Sr. Pago)
- Comisión: ~1-2% o cuota fija
- Vendor recibe notificación automática por webhook
- Sistema acredita créditos sin intervención manual

### Opción B: CoDi (Banco de México — gratis)
- Sin comisiones
- El cliente escanea QR desde su app bancaria
- Banco notifica la confirmación automáticamente
- Requiere integración con banco del vendedor (no todas las APIs son públicas)

### Opción C: WhatsApp Bot (puente manual pero más rápido)
- Bot de WhatsApp recibe capturas de comprobantes
- Sistema OCR extrae referencia SPEI
- Valida contra el banco vía scraping (frágil) o API
- Admin solo confirma en un clic desde el panel

**Para MVP: Fase 1 manual. Fase 2: evaluar CoDi si el banco del vendedor lo soporta.**

## Cálculo de comisión StreamVault

Al momento de cada venta:
```typescript
const precioProducto = 65  // créditos
const comisionPct = tenant.comision_pct / 100  // 0 en el MVP inicial
const comisionSV = precioProducto * comisionPct  // 6.5 créditos / pesos
const netoVendedor = precioProducto - comisionSV  // 58.5

// En el MVP inicial comision_pct = 0; la liquidación se habilitará por acuerdo.
// Cuando aplique, se registra en tabla `comisiones`.
// El vendedor ve su ganancia neta en su dashboard
```

## Reembolsos

Política sugerida para el vendedor:
- Si la cuenta vendida no funciona → reembolso automático de créditos
- El vendedor gestiona esto desde su panel
- La comisión de StreamVault se devuelve también (o no, configurable)
