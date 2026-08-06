# Flujo: Compra de una Cuenta de Streaming

## Precondiciones
- Cliente tiene sesión activa
- Cliente tiene saldo suficiente
- El producto tiene stock disponible (`estado = 'activo'`)

## Paso a paso

```
1. Cliente ve catálogo → selecciona Disney+
2. Ve precio: 65 créditos | Su saldo: 200 créditos ✅
3. Clic en "Comprar"
4. Pantalla de confirmación:
   - Producto: Disney+ Premium
   - Precio: 65 créditos
   - Saldo actual: 200
   - Saldo después: 135
   [Cancelar] [Confirmar compra]
5. Clic en "Confirmar compra"

--- Server Action ---
6. Verificar saldo en tiempo real (evitar race condition)
7. Obtener siguiente cuenta del inventario (FIFO):
   SELECT id, correo, password_enc FROM inventario_cuentas
   WHERE producto_id = X AND vendido = false AND tenant_id = Y
   ORDER BY created_at ASC LIMIT 1
   FOR UPDATE SKIP LOCKED  ← evita que dos compras agarren la misma cuenta
8. Descifrar contraseña (pgcrypto)
9. Descontar créditos al cliente
10. Marcar cuenta como vendida
11. Registrar movimiento en ledger
12. Calcular y registrar comisión de StreamVault
13. Registrar venta

--- Respuesta al cliente ---
14. Pantalla de éxito:
    ┌────────────────────────────────┐
    │ ✅ ¡Compra exitosa!            │
    │                                │
    │ Disney+ Premium                │
    │ 📧 usuario@correo.com          │
    │ 🔑 contraseña123               │
    │                                │
    │ [📋 Copiar todo]               │
    │                                │
    │ También te enviamos estos      │
    │ datos a tu correo.             │
    └────────────────────────────────┘
15. Email automático con las credenciales
16. Si stock llega a 0 → trigger desactiva el producto
```

## Manejo de errores

| Error | Qué mostrar |
|---|---|
| Saldo insuficiente | "No tienes créditos suficientes. Recarga aquí →" |
| Sin stock al momento de confirmar | "Lo sentimos, este producto se agotó justo ahora. Tu saldo no fue afectado." |
| Error de servidor | "Ocurrió un error. Tu saldo no fue afectado. Intenta de nuevo." |

## Server Action (Next.js)

```typescript
// app/actions/comprar.ts
'use server'

export async function comprarCuenta(productoId: string, tenantId: string, userId: string) {
  const supabase = createClient()

  // Usar transacción para garantizar atomicidad
  const { data, error } = await supabase.rpc('procesar_compra', {
    p_producto_id: productoId,
    p_tenant_id: tenantId,
    p_user_id: userId
  })

  if (error) throw new Error(error.message)
  return data // { correo, password, venta_id }
}
```

La lógica de negocio crítica va en una función SQL (RPC) para garantizar atomicidad.
