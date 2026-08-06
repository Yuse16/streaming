# Módulo: Tienda del Cliente

URL: `[slug].streamish.mx/` (raíz del subdominio)

## Quién accede

Compradores finales. Se registran directamente en la tienda del vendedor.
Un cliente registrado en `pepe.streamish.mx` NO tiene acceso a `maria.streamish.mx`.

## Páginas

### / — Home / Catálogo
- Branding del vendedor (logo, nombre, color)
- Grid de productos disponibles (solo los que tienen stock activo)
- Productos sin stock se muestran como "Agotado" o se ocultan (configurable)
- Botón de login / registro visible

### /registro
- Nombre
- Email
- Contraseña
- (Opcional) Teléfono WhatsApp — para notificaciones

### /login
- Email + contraseña
- Recuperar contraseña

### /tienda (protegida — requiere login)
- Catálogo completo con precios
- Saldo de créditos visible en todo momento (header)
- Tarjeta de cada servicio:
  - Nombre del servicio
  - Imagen del servicio
  - Precio en créditos
  - Botón "Comprar" (deshabilitado si saldo insuficiente)

### /comprar/[producto_id] (paso de confirmación)
- Resumen: producto, precio, saldo actual, saldo después de la compra
- Botón "Confirmar compra"
- Al confirmar: muestra las credenciales en pantalla + opción de copiar
- Las credenciales también llegan por email

### /mis-compras
- Historial de todas las cuentas adquiridas
- Para cada compra: servicio, correo, contraseña, fecha de compra
- Botón copiar credenciales

### /recargar
- Instrucciones de transferencia (CLABE, banco, monto, referencia)
- Formulario de solicitud:
  - Monto recargado
  - Banco origen
  - Número de referencia / folio
  - Subir captura del comprobante
- Estado de solicitudes anteriores: pendiente / aprobada / rechazada

### /perfil
- Datos personales
- Cambiar contraseña
- Historial de recargas

## UX importante

- El saldo siempre visible en el header una vez autenticado
- Si el cliente intenta comprar sin saldo suficiente → redirige a `/recargar`
- Las credenciales se muestran en la pantalla de éxito y quedan disponibles
  posteriormente para el comprador autenticado en `/mis-compras`
- Notificación por email en cada evento: registro, recarga aprobada, compra exitosa

## Personalización por tenant

El layout hereda los colores y logo del tenant:
```typescript
// app/[...]/layout.tsx
const tenant = await getCurrentTenant()
// tenant.color_primario → variable CSS --color-primary
// tenant.logo_url → imagen en header
// tenant.nombre_tienda → título de la página
```
