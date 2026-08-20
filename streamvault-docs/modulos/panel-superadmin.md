# Módulo: Panel Superadmin

URL: `superadmin.streamingos.mx`

## Quién accede

Solo tú (el operador de StreamingOS). Acceso protegido por auth separada.

## Secciones

### 1. Dashboard Global
- Total de tenants activos
- Ventas totales del día / semana / mes (suma de todos los tenants)
- Comisiones generadas para StreamingOS
- Tenants con mayor volumen de ventas
- Alertas: tenants con plan vencido, tenants inactivos

### 2. Gestión de Tenants
Lista de todos los vendedores registrados:

| Campo | Descripción |
|---|---|
| Nombre / Slug | Identifica la tienda |
| Plan | Básico / Pro / Enterprise |
| Estado | Activo / Suspendido / Pendiente de activación |
| Comisión % | Cuánto te llevas por cada venta |
| Ventas totales | Historial acumulado |
| Fecha de registro | — |

Acciones por tenant:
- **Activar / Suspender**
- **Editar comisión** (puede variar por plan o negociación)
- **Ver detalle** (ventas, clientes, inventario del tenant)
- **Agregar créditos** (si el tenant te paga suscripción o corrección)
- **Impersonar** (entrar al panel del vendedor como si fueras él, para soporte)

### 3. Solicitudes de Onboarding
Nuevos vendedores que llenaron el formulario de registro:
- Ver datos del solicitante
- Aprobar → crea tenant y envía credenciales
- Rechazar → con nota

### 4. Comisiones
- Total acumulado por tenant
- Periodo configurable
- Estado de cobro: pendiente / cobrado
- Marcar como cobrado cuando el tenant te paga su mensualidad o cuando acumulas comisiones

### 5. Catálogo Global de Servicios
Lista maestra de servicios de streaming disponibles en la plataforma:
- Nombre (Netflix, Disney+, HBO Max, Paramount+, etc.)
- Ícono / imagen oficial
- Activo para todos los tenants / solo algunos

> Los tenants no crean servicios nuevos, solo activan los del catálogo global y ponen su precio.

### 6. Planes y Precios
Configuración de planes SaaS:
- Nombre del plan
- Precio mensual
- % de comisión por venta
- Límite de productos activos
- Límite de clientes

### 7. Configuración de Plataforma
- Nombre y branding de StreamingOS
- Dominio base
- Datos de contacto de soporte
- Mensaje de bienvenida para nuevos tenants

## Reglas de negocio

- El superadmin puede ver TODO (no aplica RLS del tenant)
- Solo el superadmin puede cambiar el % de comisión de un tenant
- El superadmin puede suspender un tenant sin previo aviso (falta de pago, fraude, etc.)
- Los cambios del superadmin quedan en log de auditoría
