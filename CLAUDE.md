# Proyecto Final de Grado: Sistema Unificado de Compras - Centro Comercial

Plataforma de comercio electrónico multi-tienda para un centro comercial que permite compras centralizadas, seguimiento en tiempo real y comunicación directa entre roles.

## 🛠 Stack Tecnológico
- **Backend:** Java 21 con Spring Boot 3.5.x + Spring Security + Spring WebSocket (STOMP/SockJS).
- **Frontend:** Angular 19+ (standalone components, zoneless change detection, signals).
- **Base de Datos:** MySQL 8.0 (Docker). ORM: Spring Data JPA / Hibernate.
- **Seguridad:** JWT (jjwt 0.12.6) para autenticación stateless. Filter + ChannelInterceptor para WebSocket.
- **Comunicación en Tiempo Real:** STOMP sobre WebSocket con SockJS (backend Spring, frontend @stomp/stompjs + sockjs-client).
- **Mapas:** Google Maps API (ubicación de puestos y rutas de repartidores) — pendiente de integrar.
- **Docker:** docker-compose con MySQL, phpMyAdmin, backend (hot reload) y frontend (hot reload).

## Reglas de Código Angular
- No usar tecnología deprecated o ancticuada. Usar siempre:
  - **Reactive Forms:** `FormGroup`, `FormControl`, evento `(ngSubmit)`.
  - **Signals:** `signal()`, `computed()`, `effect()` en lugar de propiedades simples.
  - **Standalone components** (sin NgModules).
  - **`provideZonelessChangeDetection()`** ya configurado en `app.config.ts`.
  - **NO usar:** NgFor, NgForOf, en Angular 21 estan anticuados, usa mejor @for y demas sintaxis nueva pero estandarizada.

## Reglas de Código Backend
- Arquitectura limpia: Controller → Service → Repository → DTO.
- Naming en inglés para variables y métodos.
- DTOs siempre para entrada/salida de controladores (nunca exponer entidades directamente).

---

## 📋 Arquitectura y Roles
El sistema gestiona 5 perfiles de usuario (ENUM en BD y Spring Security):
1. **ADMIN:** Gestión de infraestructura, mapa del centro comercial y tiendas.
2. **CLIENTE:** Búsqueda global, carrito multi-tienda, historial y seguimiento.
3. **VENDEDOR:** Gestión de stock, productos, ofertas y chat con repartidor/proveedor.
4. **REPARTIDOR:** Gestión de entregas, actualización de ubicación GPS en tiempo real.
5. **PROVEEDOR:** Suministro de productos a vendedores.

---

## 🗄️ Esquema de Base de Datos

### Tablas existentes
- `categories`: id, name, icon, color.
- `stores`: id, name, vendedor_id, pos_x, pos_y, min_order, delivery_fee, rating, is_open.
- `products`: id, name, origin, price, is_offer, stock, shop_id, category_id.
- `store_offers`: id, store_id, product_id, price, stock.
- `delivery_zones`: id, zone_name, fee, min_time, max_time.
- `users`: id, first_name, last_name, email, password, role (ENUM: ADMIN|CLIENTE|VENDEDOR|REPARTIDOR|PROVEEDOR).
- `orders`: id, cliente_id, repartidor_id, estado (ENUM: PENDIENTE|PREPARACION|EN_RUTA|ENTREGADO), total, created_at.
- `order_items`: id, order_id, product_id, cantidad, precio_unitario.

### Tablas pendientes de crear
- `messages`: id, chat_type (ENUM: CLIENTE_REPARTIDOR|VENDEDOR_REPARTIDOR|PROVEEDOR_VENDEDOR), order_id (nullable), shop_id (nullable), remitente_id, mensaje, fecha.
- `tracking`: id, order_id, latitud, longitud, ultima_actualizacion.

---

## 🏗️ Estado de Implementación

### Backend — Implementado
- `AuthController` + JWT login/registro.
- `ProductController` + `ProductService` + `ProductRepository`.
- `OrderController` + `OrderService` + `OrderRepository`.
- `StoreController` + `StoreService` + `StoreRepository`.
- `CategoryController` + `CategoryService`.
- `DeliveryController` + `DeliveryService`.
- `JwtUtil` + `JwtAuthFilter` + `SecurityConfig` + `CorsConfig`.
- `DataInitializer` para datos de prueba.

### Backend — Pendiente
- `WebSocketConfig.java` (STOMP broker en `/ws`).
- `ChatType.java` (enum).
- `Message.java` (entidad) + `MessageRepository` + `MessageService` + `ChatController`.
- `MessageRequest/MessageResponse` DTOs.
- `ChannelInterceptor` para validar JWT en handshake WebSocket.
- `Tracking.java` + tracking GPS en tiempo real.

### Frontend — Implementado
- Componentes: `home`, `login`, `register`, `cart`, `search`, `stores`, `shipping`, `layout`.
- Servicios: `auth.service`, `cart.service`, `api.service`.
- Guards: `auth.guard`, `role.guard`.
- Interceptor JWT: `auth.interceptor`.
- Modelos TypeScript: `models.ts`.

### Frontend — Pendiente
- `chat.service.ts` (SockJS + STOMP, `Observable<MessageResponse>`).
- `chat.component` (UI de chat, aparece en contexto de pedido o tienda).
- Rutas `/orders/:id/chat` y `/shop/:id/chat` protegidas por rol.
- Dashboards por rol: Admin, Vendedor, Repartidor, Proveedor.
- Integración Google Maps para tracking.
- Historial de pedidos del cliente.

---

## 💬 Sistema de Chat — Diseño (aprobado 2026-04-23)
Spec completa: `docs/superpowers/specs/2026-04-23-chat-system-design.md`

### 3 Canales de chat
| Canal | Contexto | Topic STOMP |
|-------|----------|-------------|
| CLIENTE ↔ REPARTIDOR | Por pedido | `/topic/chat/order/{orderId}/cliente-repartidor` |
| VENDEDOR ↔ REPARTIDOR | Por pedido | `/topic/chat/order/{orderId}/vendedor-repartidor` |
| PROVEEDOR ↔ VENDEDOR | Por tienda | `/topic/chat/shop/{shopId}/proveedor-vendedor` |

### Visibilidad por rol
| Rol | Chats visibles |
|-----|----------------|
| CLIENTE | Sus pedidos → CLIENTE_REPARTIDOR |
| REPARTIDOR | Sus pedidos asignados → CLIENTE_REPARTIDOR + VENDEDOR_REPARTIDOR |
| VENDEDOR | Sus pedidos → VENDEDOR_REPARTIDOR; sus tiendas → PROVEEDOR_VENDEDOR |
| PROVEEDOR | Sus tiendas suministradas → PROVEEDOR_VENDEDOR |
| ADMIN | Sin acceso al chat |

### Endpoints REST historial
```
GET /api/messages/order/{orderId}?type=CLIENTE_REPARTIDOR
GET /api/messages/order/{orderId}?type=VENDEDOR_REPARTIDOR
GET /api/messages/shop/{shopId}?type=PROVEEDOR_VENDEDOR
```

---

## ⚖️ Reglas de Negocio
1. **Búsqueda Global:** El cliente busca productos por nombre, origen y mejores ofertas en todo el centro.
2. **Geofencing:** Notificar al cliente cuando el repartidor esté cerca (simulado vía GPS + WebSocket).
3. **Seguimiento:** Repartidores envían coordenadas vía WebSocket; cliente las visualiza en Google Maps.
4. **Seguridad:** Todas las rutas API (excepto `/api/auth/**` y búsqueda pública) protegidas por JWT + validación de rol.
5. **WebSocket seguro:** Token JWT via query param `?token=...` en handshake, validado por `ChannelInterceptor`.

---

## 🛠 Tareas Prioritarias (orden de implementación)
1. **[EN CURSO]** Sistema de chat multi-rol con STOMP/WebSocket.
2. Tabla `tracking` + tracking GPS en tiempo real.
3. Dashboards por rol en Angular (Admin, Vendedor, Repartidor, Proveedor).
4. Integración Google Maps para visualización de tracking.
5. Historial de pedidos del cliente.
