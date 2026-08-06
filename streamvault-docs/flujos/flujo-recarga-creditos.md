# Flujo: Recarga de Créditos (Cliente)

## Fase 1 — Transferencia Manual con Validación

### Desde el lado del cliente

```
1. Cliente va a /recargar
2. Ve instrucciones del vendedor:
   ┌────────────────────────────────────────┐
   │ 💳 Cómo recargar                       │
   │                                        │
   │ Banco: BBVA                            │
   │ CLABE: 012 345 678 901 234 56          │
   │ Titular: Juan García López             │
   │                                        │
   │ Importante: usa tu email como          │
   │ referencia al hacer la transferencia   │
   └────────────────────────────────────────┘
3. Cliente hace su transferencia en su banca
4. Regresa a la app y llena el formulario:
   - Monto transferido: $200
   - Banco de origen: BBVA / Banamex / HSBC / otro
   - Número de referencia / folio (opcional pero recomendado)
   - Sube captura del comprobante (foto/screenshot)
5. Envía la solicitud
6. Mensaje: "✅ Solicitud enviada. Tu vendedor la revisará pronto."
```

### Desde el lado del vendedor

```
1. Ve notificación en su panel: "Nueva solicitud de recarga"
2. Entra a "Recargas pendientes"
3. Ve la solicitud:
   Cliente: María García
   Monto: $200
   Referencia: 4521
   Comprobante: [ver imagen]
4. Abre la imagen del comprobante
5. Verifica en su banca que llegó la transferencia
6. Opciones:
   [✅ Aprobar] → Se acreditan 200 créditos a María
   [❌ Rechazar] → Abre campo para escribir motivo
7. Al aprobar:
   - saldos_clientes += 200
   - movimientos_saldo: tipo='recarga', monto=+200
   - recargas.estado = 'aprobada'
   - Email automático al cliente: "Tu recarga de 200 créditos fue aprobada"
```

## Notificaciones automáticas

| Evento | Quién recibe | Canal |
|---|---|---|
| Nueva solicitud de recarga | Vendedor | Email + notificación en panel |
| Recarga aprobada | Cliente | Email |
| Recarga rechazada | Cliente | Email con motivo |

## Estados de una recarga

```
pendiente → aprobada
pendiente → rechazada
```

No hay cancelación por parte del cliente (ya hizo la transferencia). Si hay error, el vendedor rechaza con nota explicativa.

## Fase 2 — Opciones de automatización

### A) Webhook SPEI (con intermediario)
Servicios como **Sr. Pago**, **Conekta** o **Clip** ofrecen CLABE virtual con webhook.
Cuando llega una transferencia → webhook → acreditar créditos automático.
Costo: cuota mensual fija o % pequeño.

### B) Bot WhatsApp + OCR de comprobantes
1. Vendedor tiene número de WA dedicado
2. Cliente manda comprobante por WA
3. Bot recibe la imagen
4. OCR extrae: banco, monto, referencia, fecha
5. Sistema cruza con solicitudes pendientes
6. Si hay match → aprueba automáticamente
7. Vendedor solo ve excepciones (no matches)

### C) CoDi (Banco de México)
- QR generado por la app del banco del vendedor
- Cliente escanea y paga
- Confirmación instantánea (pero requiere integración bancaria)

**Recomendación MVP:** Fase 1 manual. Evaluar Bot WhatsApp como Fase 2 ya que es de bajo costo y fácil de implementar con WhatsApp Business API (Meta tiene tier gratuito).
