# 📖 Manual de Usuario — SportReserve UPTC

Este manual explica cómo usar la plataforma SportReserve UPTC paso a paso, tanto para usuarios regulares como para administradores.

---

## Índice

1. [Acceso a la plataforma](#1-acceso-a-la-plataforma)
2. [Registro de cuenta](#2-registro-de-cuenta)
3. [Inicio de sesión](#3-inicio-de-sesión)
4. [Página de inicio](#4-página-de-inicio)
5. [Ver canchas disponibles](#5-ver-canchas-disponibles)
6. [Hacer una reserva](#6-hacer-una-reserva)
7. [Gestionar mis reservas](#7-gestionar-mis-reservas)
8. [Realizar un pago](#8-realizar-un-pago)
9. [Notificaciones](#9-notificaciones)
10. [Mi perfil](#10-mi-perfil)
11. [Panel de Administración](#11-panel-de-administración)

---

## 1. Acceso a la plataforma

Abre tu navegador web y dirígete a la dirección de la plataforma. Si estás en entorno local, ingresa a:

```
http://localhost:4200
```

---

## 2. Registro de cuenta

Si es tu primera vez en la plataforma:

1. En la pantalla de inicio haz clic en **"Registrarse"**.
2. Completa el formulario con:
   - Nombre completo
   - Correo institucional (ej: `usuario@uptc.edu.co`)
   - Contraseña (mínimo 8 caracteres)
3. Haz clic en **"Crear cuenta"**.
4. Recibirás una confirmación y serás redirigido al inicio de sesión.

---

## 3. Inicio de sesión

1. Ingresa tu **correo** y **contraseña** registrados.
2. Haz clic en **"Ingresar"**.
3. Si los datos son correctos, accederás al panel principal (dashboard).

> ⚠️ Si olvidaste tu contraseña, contacta al administrador del sistema.

---

## 4. Página de inicio

Después de iniciar sesión verás el **Dashboard** con:

- Resumen de tus reservas activas
- Canchas disponibles próximamente
- Notificaciones recientes
- Accesos directos a las secciones principales

---

## 5. Ver canchas disponibles

1. En el menú lateral, haz clic en **"Canchas"** o **"Sports Fields"**.
2. Verás la lista de todas las canchas disponibles con su nombre, tipo de deporte y estado.
3. Haz clic en una cancha para ver su detalle: horarios disponibles, descripción y ubicación.

---

## 6. Hacer una reserva

1. Entra al detalle de la cancha que deseas reservar.
2. Selecciona la **fecha** y el **horario** disponible.
3. Haz clic en **"Reservar"**.
4. Revisa el resumen de la reserva (cancha, fecha, hora, costo).
5. Confirma haciendo clic en **"Confirmar reserva"**.
6. Recibirás una notificación de confirmación.

> 💡 Solo puedes reservar canchas con disponibilidad marcada en verde.

---

## 7. Gestionar mis reservas

1. Ve a la sección **"Reservas"** en el menú.
2. Verás la lista de todas tus reservas con su estado:
   - **Pendiente**: reserva creada, pago pendiente
   - **Confirmada**: reserva activa con pago completado
   - **Cancelada**: reserva anulada
3. Para cancelar una reserva, haz clic en ella y selecciona **"Cancelar reserva"**.

---

## 8. Realizar un pago

1. Ve a la sección **"Pagos"** o accede desde el detalle de tu reserva.
2. Selecciona la reserva pendiente de pago.
3. Elige el método de pago disponible.
4. Completa los datos requeridos y haz clic en **"Pagar"**.
5. Al completarse, tu reserva cambiará a estado **Confirmada**.

---

## 9. Notificaciones

- El ícono de campana 🔔 en la barra superior muestra tus notificaciones.
- Recibirás notificaciones cuando:
  - Tu reserva sea confirmada
  - Tu reserva sea cancelada
  - Un pago sea procesado
  - El administrador envíe un aviso
- Haz clic en una notificación para marcarla como leída.

---

## 10. Mi perfil

1. Haz clic en tu nombre o avatar en la esquina superior.
2. Selecciona **"Perfil"**.
3. Podrás ver y editar:
   - Nombre y apellido
   - Correo electrónico
   - Contraseña
4. Haz clic en **"Guardar cambios"** para actualizar tu información.

---

## 11. Panel de Administración

> Esta sección es exclusiva para usuarios con rol **Administrador**.

### Gestión de canchas
1. Ve a **Admin → Canchas**.
2. Puedes crear, editar o desactivar canchas.
3. Al crear una cancha, completa: nombre, tipo de deporte, descripción, horarios disponibles.

### Gestión de usuarios
1. Ve a **Admin → Usuarios**.
2. Puedes ver todos los usuarios registrados, cambiar roles o eliminar cuentas.

### Dashboard administrativo
- Accede a **Admin → Dashboard** para ver:
  - Total de reservas del mes
  - Ingresos por pagos
  - Canchas más utilizadas
  - Usuarios activos

### Reportes
- Ve a **Admin → Reportes** para generar y exportar informes de uso de canchas y reservas por período.

---

## Soporte

Para reportar problemas o solicitar ayuda, contacta al equipo en:  
📧 `support@sportreserve-uptc.com`