# Módulo: Panel del Vendedor (Admin Tenant)

URL: `[custom_domain]/admin`

## Quién accede

El dueño de la tienda. Solo él y los usuarios que él mismo invite como co-admin.

## Secciones del panel

### 1. Dashboard
- Ventas del día / semana / mes
- Productos con stock bajo (alerta cuando quedan < 3 cuentas)
- Productos desactivados por stock agotado
- Últimas transacciones
- Balance de comisiones pagadas a StreamingOS

### 2. Inventario de Cuentas
Lista de todos los productos (Disney+, HBO, Netflix, etc.) con:
- Nombre del servicio
- Ícono / imagen del servicio (fija, sube una sola vez)
- Stock disponible (número de cuentas listas para vender)
- Precio de venta
- Estado: `activo` / `sin stock` / `desactivado manualmente`
- Botón: **Cargar cuentas** (abre modal de carga manual o por imagen)

### 3. Cargar Cuentas (modal)
Dos métodos:
- **Manual:** campo de texto donde pega las cuentas en formato `correo:contraseña` una por línea
- **Por imagen:** sube captura, el sistema extrae las credenciales con OCR

Al confirmar:
- El sistema parsea las cuentas
- Muestra preview: "Se detectaron X cuentas — ¿confirmar?"
- Si había stock 0, el producto se reactiva automáticamente

### 4. Clientes
- Lista de clientes registrados en su tienda
- Ver saldo de créditos de cada cliente
- Agregar créditos manualmente (cuando validan transferencia)
- Ver historial de compras por cliente
- Desactivar cuenta de cliente

### 5. Recargas Pendientes
- Lista de solicitudes de recarga enviadas por clientes
- Cada una muestra: cliente, monto, banco, número de referencia, captura de transferencia
- Botones: **Aprobar** (suma créditos) | **Rechazar** (con nota)

### 6. Historial de Ventas
- Tabla con todas las ventas
- Filtros: fecha, producto, cliente
- Columnas: fecha, cliente, producto, precio, comisión descontada, neto recibido
- Exportar a CSV

### 7. Configuración de Tienda
- Nombre de la tienda
- Logo
- Color primario
- Datos bancarios para transferencias (CLABE, banco, titular)
- Instrucciones personalizadas de recarga
- Precios por producto

## Estados de un producto

```
sin stock → (se carga inventario) → activo → (se agotan cuentas) → sin stock
activo → (vendedor lo desactiva) → desactivado
desactivado → (vendedor lo reactiva) → activo (si hay stock)
```

## Reglas de negocio

- Un vendedor no puede ver los datos de otro tenant
- El precio lo fija el vendedor, pero StreamingOS descuenta su % antes de acreditar
- El vendedor ve sus ganancias ya descontada la comisión
- No puede modificar el % de comisión (lo define el superadmin por plan)
