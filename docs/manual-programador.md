# 👨‍💻 Manual del Programador — SportReserve UPTC

Este manual está dirigido a desarrolladores que quieran entender, instalar, configurar o contribuir al proyecto SportReserve UPTC.

---

## Índice

1. [Requisitos previos](#1-requisitos-previos)
2. [Instalación del entorno](#2-instalación-del-entorno)
3. [Estructura del proyecto](#3-estructura-del-proyecto)
4. [Variables de entorno](#4-variables-de-entorno)
5. [Ejecución en desarrollo](#5-ejecución-en-desarrollo)
6. [Arquitectura del sistema](#6-arquitectura-del-sistema)
7. [Módulos del backend](#7-módulos-del-backend)
8. [Módulos del frontend](#8-módulos-del-frontend)
9. [Autenticación y seguridad](#9-autenticación-y-seguridad)
10. [Flujo de trabajo con Git](#10-flujo-de-trabajo-con-git)
11. [Convenciones de código](#11-convenciones-de-código)

---

## 1. Requisitos previos

Antes de instalar el proyecto asegúrate de tener:

| Herramienta | Versión mínima | Descarga |
|-------------|---------------|---------|
| Node.js | v18 o superior | https://nodejs.org |
| npm | v9 o superior | Incluido con Node.js |
| Git | Cualquier versión reciente | https://git-scm.com |
| VSCode | Recomendado | https://code.visualstudio.com |

---

## 2. Instalación del entorno

### Clonar el repositorio

```bash
git clone https://github.com/NicoVerdugo/SportReserve-UPTC.git
cd SportReserve-UPTC
```

### Instalar dependencias del frontend

```bash
npm install
```

### Instalar dependencias del backend

```bash
cd backend
npm install
cd ..
```

### Configurar variables de entorno

Crea un archivo `.env` dentro de la carpeta `backend/` con las variables necesarias (ver sección 4).

---

## 3. Estructura del proyecto

```
SportReserve-UPTC/
├── src/                        # Frontend Angular
│   ├── app/
│   │   ├── core/               # Guardias, interceptores, servicios globales
│   │   ├── features/           # Módulos por funcionalidad
│   │   │   ├── admin/          # Panel de administración
│   │   │   ├── auth/           # Login y registro
│   │   │   ├── dashboard/      # Panel principal
│   │   │   ├── home/           # Página de inicio
│   │   │   ├── notifications/  # Notificaciones
│   │   │   ├── payments/       # Pagos
│   │   │   ├── profile/        # Perfil de usuario
│   │   │   ├── reports/        # Reportes
│   │   │   ├── reservations/   # Reservas
│   │   │   └── sports-fields/  # Canchas deportivas
│   │   ├── layouts/            # Layouts reutilizables
│   │   └── shared/             # Componentes y utilidades compartidas
│   └── environments/           # Configuración por entorno
├── backend/                    # Backend Express
│   └── src/
│       ├── config/             # Configuración general
│       ├── database/           # Conexión a base de datos
│       ├── interfaces/         # Interfaces TypeScript
│       ├── middleware/         # Middlewares (auth, errores, validación)
│       ├── modules/            # Módulos de la API
│       │   ├── auth/           # Autenticación
│       │   ├── dashboard/      # Dashboard
│       │   ├── fields/         # Canchas
│       │   ├── notifications/  # Notificaciones
│       │   ├── payments/       # Pagos
│       │   ├── reports/        # Reportes
│       │   ├── reservations/   # Reservas
│       │   └── users/          # Usuarios
│       └── utils/              # Utilidades (JWT, email, respuestas)
├── docs/                       # Documentación del proyecto
│   ├── API.md                  # Referencia de endpoints
│   ├── manual-usuario.md       # Manual de usuario
│   └── manual-programador.md   # Este archivo
├── public/                     # Archivos estáticos
└── README.md                   # Descripción general
```

---

## 4. Variables de entorno

Crea el archivo `backend/.env` con las siguientes variables:

```env
# Servidor
PORT=3000
NODE_ENV=development

# Base de datos
DB_URI=mongodb://localhost:27017/sportreserve

# JWT
JWT_SECRET=tu_clave_secreta_aqui
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=tu_clave_refresh_aqui
JWT_REFRESH_EXPIRES_IN=7d

# Correo (para recuperación de contraseña)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu_correo@gmail.com
EMAIL_PASS=tu_contraseña_de_aplicacion
```

> ⚠️ Nunca subas el archivo `.env` al repositorio. Ya está incluido en el `.gitignore`.

---

## 5. Ejecución en desarrollo

### Correr el backend

```bash
cd backend
npm run dev
```

El servidor queda disponible en: `http://localhost:3000`

La documentación Swagger queda en: `http://localhost:3000/api/docs`

### Correr el frontend

```bash
# Desde la raíz del proyecto
npm start
```

La app queda disponible en: `http://localhost:4200`

---

## 6. Arquitectura del sistema

El proyecto sigue una arquitectura **cliente-servidor** desacoplada:

```
┌─────────────────┐         HTTP/REST         ┌─────────────────┐
│                 │  ──────────────────────►  │                 │
│  Frontend       │                           │  Backend        │
│  Angular 20     │  ◄──────────────────────  │  Express + TS   │
│  Puerto 4200    │         JSON              │  Puerto 3000    │
└─────────────────┘                           └────────┬────────┘
                                                       │
                                                       ▼
                                              ┌─────────────────┐
                                              │   Base de datos  │
                                              │   MongoDB        │
                                              └─────────────────┘
```

### Patrón del backend

Cada módulo del backend sigue el patrón de 4 capas:

- **routes** — define los endpoints y aplica middlewares
- **controller** — recibe la petición HTTP y devuelve la respuesta
- **service** — contiene toda la lógica de negocio
- **validators** — valida los datos del body antes de llegar al controlador

---

## 7. Módulos del backend

| Módulo | Ruta base | Descripción |
|--------|-----------|-------------|
| auth | `/api/auth` | Registro, login, tokens JWT, perfil propio |
| users | `/api/users` | Gestión de usuarios (admin) |
| fields | `/api/fields` | Gestión de canchas deportivas |
| reservations | `/api/reservations` | Creación y gestión de reservas |
| payments | `/api/payments` | Registro y control de pagos |
| notifications | `/api/notifications` | Notificaciones del sistema |
| dashboard | `/api/dashboard` | Estadísticas generales |
| reports | `/api/reports` | Generación de reportes |

Para más detalle de cada endpoint ver [`API.md`](./API.md).

---

## 8. Módulos del frontend

El frontend usa una arquitectura modular por funcionalidad en `src/app/features/`:

- **auth** — pantallas de login y registro
- **dashboard** — panel principal con resumen
- **sports-fields** — listado y detalle de canchas
- **reservations** — crear y gestionar reservas
- **payments** — historial y proceso de pago
- **notifications** — centro de notificaciones
- **profile** — editar perfil de usuario
- **reports** — visualización de reportes
- **admin** — panel exclusivo para administradores

---

## 9. Autenticación y seguridad

El sistema usa **JWT (JSON Web Tokens)** con doble token:

- **Access Token** — de corta duración (15 minutos), se usa en cada petición en el header `Authorization: Bearer <token>`
- **Refresh Token** — de larga duración (7 días), se usa para renovar el access token sin volver a hacer login

El frontend guarda los tokens usando el servicio `TokenService` ubicado en `src/app/core/services/token.ts`.

---

## 10. Flujo de trabajo con Git

### Ramas
- `main` — rama principal, solo código estable
- `documentacion` — rama de documentación
- Cada desarrollador trabaja en su propia rama

### Pasos para contribuir

```bash
# 1. Crear rama nueva
git checkout -b nombre-de-la-rama

# 2. Hacer cambios y commit
git add .
git commit -m "tipo: descripción corta del cambio"

# 3. Subir la rama
git push origin nombre-de-la-rama

# 4. Abrir Pull Request en GitHub hacia main
```

### Tipos de commit recomendados

| Tipo | Uso |
|------|-----|
| `feat` | Nueva funcionalidad |
| `fix` | Corrección de bug |
| `docs` | Documentación |
| `refactor` | Refactorización de código |
| `style` | Cambios de formato |

---

## 11. Convenciones de código

- Lenguaje: **TypeScript** en frontend y backend
- Nombres de archivos: `kebab-case` (ej: `auth.service.ts`)
- Nombres de clases: `PascalCase` (ej: `AuthService`)
- Nombres de variables y funciones: `camelCase` (ej: `getUserById`)
- Comentarios: en español para mayor claridad del equipo
- Cada función debe tener su comentario JSDoc explicando qué hace, parámetros y errores posibles