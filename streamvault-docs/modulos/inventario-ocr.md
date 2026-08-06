# Módulo: Inventario y Carga de Cuentas (OCR)

## Concepto

El vendedor sube capturas de pantalla con correos y contraseñas de cuentas de streaming.
El sistema extrae las credenciales, las almacena en el inventario y activa el producto si estaba sin stock.

## Formato esperado de las capturas

Los vendedores típicamente tienen imágenes como:

```
disney@correo.com:contraseña123
disney2@correo.com:contraseña456
disney3@correo.com:contraseña789
```

O en tabla / formato variado. El OCR debe tolerar variaciones.

## Opciones de implementación

### Opción A: Tesseract.js (sin costo, menor precisión)
- Corre en el servidor (Node.js)
- Bueno para texto limpio y bien formateado
- Puede fallar con capturas borrosas, rotadas o con fondos complejos

```typescript
import Tesseract from 'tesseract.js'

async function extractTextFromImage(imageBuffer: Buffer): Promise<string> {
  const { data: { text } } = await Tesseract.recognize(imageBuffer, 'spa+eng', {
    tessedit_char_whitelist: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@.:_-'
  })
  return text
}
```

### Opción B: Claude Vision API (recomendada — más precisa)
- Se envía la imagen a Claude con un prompt estructurado
- Devuelve JSON con las credenciales ya parseadas
- Costo: ~$0.003 por imagen (muy bajo para el volumen esperado)

```typescript
async function extractAccountsFromImage(base64Image: string) {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1000,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image',
          source: { type: 'base64', media_type: 'image/jpeg', data: base64Image }
        },
        {
          type: 'text',
           text: `Extrae todas las credenciales de esta imagen.
          Devuelve SOLO un JSON con este formato, sin explicaciones:
          {"cuentas": [{"correo": "...", "password": "..."}, ...]}
          Si no encuentras credenciales válidas, devuelve: {"cuentas": []}`
        }
      ]
    }]
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  return JSON.parse(text)
}
```

**Recomendación: empezar con Opción A y tener B como fallback si la precisión no es suficiente.**

## Flujo completo de carga

```
1. Vendedor abre modal "Cargar cuentas" para Disney+
2. Selecciona método: Manual | Por imagen
3. [Por imagen] Sube la captura
4. Server action recibe la imagen
5. Se procesa con OCR/Vision
6. Se parsean las líneas con regex: /^[\w.+-]+@[\w-]+\.[a-z]{2,}:(.+)$/gm
7. Se muestra preview:
   ✅ correo1@gmail.com → ••••••••
   ✅ correo2@gmail.com → ••••••••
   ⚠️ línea no reconocida: "dsny premium"
8. Vendedor confirma o edita manualmente
9. Se insertan en tabla `inventario_cuentas` cifradas
10. Si producto tenía stock = 0 → se actualiza a activo
```

## Parser de texto (regex)

```typescript
function parseCredentials(rawText: string): {correo: string, password: string}[] {
  const lines = rawText.split('\n')
  const results = []

  for (const line of lines) {
    const trimmed = line.trim()
    // Soporta separadores: : | / espacio
    const match = trimmed.match(/^([\w.+%-]+@[\w.-]+\.[a-z]{2,})\s*[:|\/ ]\s*(.+)$/i)
    if (match) {
      results.push({ correo: match[1].toLowerCase(), password: match[2].trim() })
    }
  }

  return results
}
```

## Control de stock automático

Trigger en Supabase que actualiza el estado del producto:

```sql
-- Función que actualiza estado del producto basado en stock
create or replace function update_product_status()
returns trigger as $$
declare
  v_producto_id uuid;
  v_tenant_id uuid;
begin
  v_producto_id := coalesce(NEW.producto_id, OLD.producto_id);
  v_tenant_id := coalesce(NEW.tenant_id, OLD.tenant_id);
  update productos
  set estado = case
    when desactivado_manualmente then 'desactivado'
    when (
      select count(*) from inventario_cuentas
      where producto_id = v_producto_id
      and vendido = false
      and tenant_id = v_tenant_id
    ) > 0 then 'activo'
    else 'sin_stock'
  end
  where id = v_producto_id;
  return coalesce(NEW, OLD);
end;
$$ language plpgsql;

-- Trigger después de insertar, actualizar o eliminar cuenta
create trigger trg_update_product_status
after insert or update or delete on inventario_cuentas
for each row execute function update_product_status();
```

## Seguridad del inventario

- Las contraseñas se almacenan cifradas con `pgcrypto` en Supabase
- Solo se descifran en el momento exacto de la compra (server-side)
- El vendedor nunca ve las contraseñas en texto plano desde el panel (solo el conteo)
- Log de auditoría: quién descifró qué y cuándo
