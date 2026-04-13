# Sistema de Notificaciones In-App

## Resumen

Sistema de notificaciones en tiempo real por compania. Cuando ocurre un evento relevante (aprobacion de credito, firma de pagare, etc.), se crea un registro en la tabla `notifications` de Supabase. El frontend recibe el INSERT via Supabase Realtime (WebSocket) y lo muestra al usuario sin necesidad de recargar.

---

## Arquitectura

```
Backend (NestJS)                    Supabase                         Frontend (Angular)
┌──────────────┐    INSERT      ┌──────────────────┐   WebSocket   ┌──────────────────┐
│ Evento en    │ ──────────────>│ Tabla            │ ────────────> │ NotificationCenter│
│ el sistema   │  notifications │ notifications    │  Realtime     │ Service           │
│ (CRUD, etc.) │                │                  │               │                   │
└──────────────┘                └──────────────────┘               │ -> signal update  │
                                                                   │ -> banner temporal│
                                                                   │ -> badge en bell  │
                                                                   └──────────────────┘
```

**El backend solo inserta en la tabla.** Supabase Realtime detecta el INSERT y lo envia por WebSocket a los clientes Angular suscritos. No se necesita WebSocket en NestJS.

---

## Modelo de datos

### Tabla `notifications`

| Campo        | Tipo      | Descripcion                                              |
|--------------|-----------|----------------------------------------------------------|
| id           | uuid      | PK                                                       |
| company_id   | uuid      | FK -> companies. La notificacion pertenece a la compania |
| created_by   | uuid      | FK -> users. Quien ejecuto la accion                     |
| type         | uuid      | FK -> parameters. Categoria del evento                   |
| title        | string    | Titulo corto ("Pagare firmado")                          |
| message      | string    | Detalle ("Gabriel firmo el pagare del estudio #123")     |
| route        | string    | Ruta frontend ("/app/credit-study/detail/abc-123")       |
| created_at   | timestamp | Fecha de creacion                                        |

### Tabla `notification_reads`

| Campo           | Tipo      | Descripcion                                  |
|-----------------|-----------|----------------------------------------------|
| id              | uuid      | PK                                           |
| notification_id | uuid      | FK -> notifications                          |
| user_id         | uuid      | FK -> users. Quien la marco como leida       |
| read_at         | timestamp | Cuando la marco                              |

Constraint unique en (`notification_id`, `user_id`).

**Por que dos tablas?** La notificacion es de la compania, no de un usuario. Cada usuario la marca como leida independientemente.

---

## Configuracion de Supabase

1. **Habilitar Realtime** en la tabla `notifications` (solo evento INSERT)
2. **RLS Policy** de SELECT filtrada por `company_id` del usuario autenticado

```sql
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their company notifications"
ON notifications FOR SELECT
USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));
```

---

## Componentes del frontend

### Archivos

```
src/app/
├── types/
│   └── notification.ts                          # AppNotification, NotificationUser, NotificationRead, NotificationResponse
├── core/services/
│   └── notification-center.service.ts           # Servicio central (API + Realtime)
└── layout/components/
    └── notification-center/
        ├── notification-center.ts               # Componente (bell + drawer + banner)
        ├── notification-center.html             # Template
        └── time-ago.pipe.ts                     # Pipe "Hace 5 min"
```

### Interfaces (types/notification.ts)

- **`NotificationUser`**: `{ id, name, lastName }` — quien genero la notificacion
- **`AppNotification`**: `{ id, title, message, route, createdAt, type (Parameter), createdByUser (NotificationUser), read }`
- **`NotificationRead`**: `{ id, notificationId, userId, readAt }`
- **`NotificationResponse`**: `{ data: AppNotification[], meta: { total, page, limit, totalPages } }`

### NotificationCenterService

Servicio singleton (`providedIn: 'root'`) que gestiona todo el ciclo de vida de las notificaciones.

El servicio obtiene el `companyId` internamente desde `authService.currentProfile().userCompanies[0].companyId`, siguiendo el mismo patron que `CreditStudyService`, `CustomersService` y `DashboardService`.

**Signals:**

| Signal                 | Tipo                    | Descripcion                                    |
|------------------------|-------------------------|------------------------------------------------|
| `notifications`        | `AppNotification[]`     | Lista de notificaciones cargadas               |
| `unreadCount`          | `number`                | Cantidad de no leidas                          |
| `incomingNotification` | `AppNotification\|null` | Notificacion entrante (para el banner temporal) |
| `loading`              | `boolean`               | Estado de carga                                |
| `page`                 | `number`                | Pagina actual                                  |
| `totalPages`           | `number`                | Total de paginas                               |
| `total`                | `number`                | Total de notificaciones                        |
| `hasUnread`            | `boolean` (computed)    | Si hay al menos una no leida                   |

**Metodos:**

| Metodo                        | Descripcion                                                                  |
|-------------------------------|------------------------------------------------------------------------------|
| `loadNotifications(page,limit)` | GET companies/{companyId}/notifications. Carga lista paginada              |
| `loadUnreadCount()`           | GET companies/{companyId}/notifications/unread-count                         |
| `subscribeRealtime()`         | Se suscribe al canal Supabase para INSERTs de la compania del usuario       |
| `markAsRead(id)`              | PATCH companies/{companyId}/notifications/:id/read                           |
| `markAllAsRead()`             | PATCH companies/{companyId}/notifications/read-all                           |
| `navigateToNotification(n)`   | Marca como leida + cierra panel + router.navigateByUrl(route)                |
| `loadMore()`                  | Carga la siguiente pagina y la agrega al listado existente                   |
| `dismissBanner()`             | Oculta el banner de notificacion entrante                                    |

### Flujo Realtime

1. El servicio llama `subscribeRealtime()` al inicializar el componente
2. Se suscribe al canal `notifications:{companyId}` escuchando `postgres_changes` INSERT
3. Cuando llega un INSERT:
   - Se agrega al inicio del signal `notifications`
   - Se incrementa `unreadCount`
   - Se muestra el banner temporal (desaparece automaticamente en 5 segundos)

### Componente NotificationCenter

Se renderiza en `layout.html` como `<app-notification-center />`.

**Elementos UI:**

- **Campanita en topbar** (`pi-bell`): entre el boton de paleta y el perfil. Muestra badge rojo con el conteo de no leidas.
- **Banner flotante** (top-right): aparece cuando llega una notificacion via Realtime. Dice "Nueva notificacion disponible". Desaparece en 5s o al hacer click (abre el drawer).
- **Drawer** (derecha a izquierda): mismo patron que el configurator y help-panel. Muestra:
  - Lista paginada de notificaciones con icono segun tipo, titulo, mensaje truncado, tiempo relativo
  - Indicador visual de no leida (punto azul)
  - Boton "Marcar todas como leidas" en el header
  - Boton "Cargar mas" al final si hay mas paginas
  - Estado vacio con icono `pi-bell-slash`
  - Skeletons durante la carga

---

## Endpoints REST que consume el frontend

Base path: `/api/companies/{companyId}/notifications`

Todos los endpoints usan `Authorization: Bearer <token>`.

### 1. Listar notificaciones

```
GET /api/companies/{companyId}/notifications?page=1&limit=10&typeId=5
```

Response:
```json
{
  "data": [
    {
      "id": "notif-uuid-001",
      "title": "Estudio de credito aprobado",
      "message": "El estudio de credito de Empresa XYZ fue analizado. Resultado: Aprobado (82/100).",
      "route": "/app/credit-study/detail/study-uuid-123",
      "createdAt": "2026-04-13T15:30:00.000Z",
      "type": {
        "id": 5,
        "label": "Estudio de Credito",
        "code": "credit_study"
      },
      "createdByUser": {
        "id": "user-uuid-001",
        "name": "Gabriel",
        "lastName": "Herrera"
      },
      "read": false
    }
  ],
  "meta": {
    "total": 25,
    "page": 1,
    "limit": 10,
    "totalPages": 3
  }
}
```

### 2. Conteo de no leidas

```
GET /api/companies/{companyId}/notifications/unread-count
```

Response:
```json
{
  "unreadCount": 7
}
```

### 3. Marcar como leida

```
PATCH /api/companies/{companyId}/notifications/{id}/read
```

Response:
```json
{
  "id": "read-uuid-001",
  "notificationId": "notif-uuid-001",
  "userId": "user-uuid-001",
  "readAt": "2026-04-13T16:00:00.000Z"
}
```

### 4. Marcar todas como leidas

```
PATCH /api/companies/{companyId}/notifications/read-all
```

Response:
```json
{
  "count": 7
}
```

---

## Iconos por tipo de notificacion

El componente asigna iconos segun el `code` del parametro `type`:

| code           | Icono            |
|----------------|------------------|
| `credit_study` | `pi pi-file`     |
| `customer`     | `pi pi-users`    |
| `payment`      | `pi pi-wallet`   |
| default        | `pi pi-info-circle` |

Para agregar nuevos tipos, actualizar el metodo `getTypeIcon()` en `notification-center.ts`.

---

## Archivos modificados (respecto al proyecto base)

| Archivo                                 | Cambio                                                |
|-----------------------------------------|-------------------------------------------------------|
| `core/services/supabase.service.ts`     | Getter `client` para exponer el SupabaseClient        |
| `layout/service/layout.service.ts`      | `notificationPanelVisible` + `toggleNotificationPanel()` |
| `layout/components/topbar/topbar.ts`    | Import BadgeModule + NotificationCenterService + boton bell |
| `layout/components/topbar/topbar.html`  | Boton campanita con badge entre paleta y perfil       |
| `layout/components/layout.ts`           | Import NotificationCenter                             |
| `layout/components/layout.html`         | `<app-notification-center />`                         |
| `assets/styles.scss`                    | Animacion `animate-slidedown` para el banner          |
