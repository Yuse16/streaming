# Flujo: Carga de Inventario por Vendedor

## Método 1 — Entrada Manual

```
1. Vendedor va a su panel → Inventario
2. Selecciona producto (ej: HBO Max)
3. Clic en "Cargar cuentas"
4. Selecciona "Entrada manual"
5. Pega en el textarea:
   usuario1@gmail.com:pass123
   usuario2@hotmail.com:clave456
   usuario3@outlook.com:secreto789
6. Sistema hace preview en tiempo real mientras escribe:
   ✅ usuario1@gmail.com
   ✅ usuario2@hotmail.com
   ✅ usuario3@outlook.com
   — 3 cuentas detectadas —
7. Clic en "Confirmar y agregar"
8. Se insertan en la BD
9. Si producto estaba sin stock → se reactiva
10. Toast: "✅ 3 cuentas agregadas. HBO Max está activo."
```

## Método 2 — Carga por Imagen (OCR)

```
1. Vendedor abre modal → selecciona "Subir imagen"
2. Arrastra o selecciona la captura
3. Preview de la imagen en el modal
4. Sistema procesa (spinner): "Detectando cuentas..."
5. Resultado:
   ✅ correo1@gmail.com → detectada
   ✅ correo2@hotmail.com → detectada
   ⚠️ "dsny prem" → no reconocida (se muestra en gris)
   ✅ correo3@outlook.com → detectada
   — 3 de 4 líneas reconocidas —
6. Vendedor puede:
   - Editar cualquier cuenta antes de confirmar
   - Eliminar líneas no válidas
   - Agregar manualmente las que no se detectaron
7. Confirmar → mismo flujo que método manual
```

## Validaciones antes de insertar

```typescript
function validarCuenta(correo: string, password: string): ValidationResult {
  const errores = []

  if (!correo.match(/^[\w.+%-]+@[\w.-]+\.[a-z]{2,}$/i))
    errores.push('Correo inválido')

  if (!password || password.length < 4)
    errores.push('Contraseña muy corta')

  return { valida: errores.length === 0, errores }
}
```

## Detección de duplicados

Antes de insertar, verificar si ese correo ya existe en el inventario del mismo producto:
```sql
SELECT id FROM inventario_cuentas
WHERE tenant_id = $1 AND producto_id = $2 AND correo = $3 AND vendido = false
```

Si ya existe → mostrar advertencia pero permitir al vendedor decidir si ignorar o saltarla.

## Resultado en base de datos

```
inventario_cuentas:
  id: uuid
  tenant_id: uuid
  producto_id: uuid
  correo: text
  password_enc: text  ← cifrado con pgcrypto
  vendido: false
  vendido_at: null
  venta_id: null
  created_at: now()
```

## Efecto en el producto

```sql
-- Trigger automático actualiza productos.estado
-- Si cuenta vendido=false count > 0 → 'activo'
-- Si count = 0 → 'sin_stock'
```
