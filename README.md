# MercaFácil

> Plataforma de comercio electrónico multi-tienda para el centro comercial **Jaén Plaza**.  
> Proyecto de Fin de Grado — Desarrollo de Aplicaciones Web (DAW), 2025/2026.

---

## ¿Qué es MercaFácil?

MercaFácil permite a los clientes explorar las tiendas del centro comercial, añadir productos al carrito y realizar pedidos desde una sola aplicación. Los pedidos fluyen en tiempo real a través de cinco roles: el cliente compra, el vendedor prepara, el repartidor recoge y entrega, el proveedor gestiona el stock con los vendedores y el administrador supervisa todo.

El sistema incluye **seguimiento GPS en vivo** durante la entrega, **chat en tiempo real** entre roles y un **mapa interactivo SVG** del propio centro comercial.

---

## Stack tecnológico

| Capa            | Tecnología                                                                |
| --------------- | ------------------------------------------------------------------------- |
| Backend         | Java 21 · Spring Boot · Spring Security · Spring WebSocket (STOMP/SockJS) |
| Frontend        | Angular 21 · Standalone · Zoneless change detection · Signals             |
| Base de datos   | MySQL                                                                     |
| ORM             | Spring Data JPA / Hibernate                                               |
| Seguridad       | JWT stateless                                                             |
| Mapas           | Google Maps JS API · `@angular/google-maps`                               |
| Tiempo real     | STOMP sobre WebSocket                                                     |
| Infraestructura | Docker · Docker Compose · phpMyAdmin                                      |

---

## Arquitectura

### Backend — patrón MVC con capa de servicio

```
Controller  →  Service  →  Repository  →  Base de datos
                ↕
              DTOs  (nunca se exponen entidades JPA directamente)
```

Cada dominio tiene su propio controlador REST:  
`AuthController`, `OrderController`, `CartController`, `ProductController`,  
`VendedorController`, `RepartidorController`, `ProveedorController`,  
`AdminController`, `ChatController`, `TrackingController`…

La seguridad se aplica en dos niveles: filtro HTTP con JWT para las rutas REST y un `ChannelInterceptor` STOMP para los canales WebSocket.

### Frontend — Angular 21 reactivo

Componentes standalone sin módulos. El estado se gestiona con **signals** (`signal`, `computed`, `effect`). Las plantillas usan la sintaxis de control flow moderna (`@if`, `@for`), sin `ngIf` y demas que aparecen deprecated.

---

## Funcionalidades principales

### Mapa interactivo del centro comercial

La página de inicio incluye un mapa SVG del edificio real de Jaén Plaza con imagen satélite de fondo. Cada tienda tiene una zona coloreada superpuesta sobre su ubicación física exacta. Al hacer clic en una zona se resalta la tienda en el panel lateral y desde ahí se puede navegar directamente a sus productos.

### Seguimiento GPS en tiempo real

Cuando un repartidor cambia un pedido a estado `EN_RUTA`, inicia una simulación de coordenadas GPS que se publica en un topic STOMP (`/topic/tracking/order/{orderId}`). El cliente ve el marcador moverse sobre Google Maps en su página de detalle del pedido. El componente `LiveMapComponent` es reutilizable en toda la aplicación y carga el script de Google Maps una única vez bajo demanda gracias a `MapsLoaderService`. Si no hay API key configurada, muestra las coordenadas en texto como fallback.

### Chat multi-rol en tiempo real

El sistema de mensajería cubre tres canales distintos:

- **Cliente ↔ Repartidor** — por pedido
- **Vendedor ↔ Repartidor** — por pedido
- **Proveedor ↔ Vendedor** — por tienda

Cada mensaje se envía por STOMP y se persiste en base de datos. La bandeja de chats (`/chats`) muestra todos los hilos del usuario autenticado con el número de mensajes no leídos. Un badge rojo en la barra de navegación se actualiza en tiempo real para todos los roles a través del `NotificationService`.

### Seguridad JWT stateless

El login devuelve un token JWT firmado que el frontend adjunta en cada petición mediante un interceptor HTTP. En el lado del servidor, un filtro valida la firma y carga las autoridades del usuario (rol) antes de que llegue al controlador. Los canales WebSocket también validan el token en el handshake STOMP.

### Checkout con validación de tarjeta

El flujo de pago incluye un formulario de dirección de entrega completo (calle, número, CP, ciudad, provincia) y un pago simulado con validación del número de tarjeta mediante el algoritmo de Luhn y verificación de fecha de vencimiento.

---

## Roles del sistema

| Rol            | Descripción                                                                      |
| -------------- | -------------------------------------------------------------------------------- |
| **CLIENTE**    | Navega el catálogo, gestiona su carrito y sigue sus pedidos en tiempo real       |
| **VENDEDOR**   | Gestiona sus productos y ofertas, ve los pedidos de su tienda y cambia su estado |
| **REPARTIDOR** | Acepta pedidos disponibles, avanza su estado y emite su posición GPS             |
| **PROVEEDOR**  | Supervisa las tiendas y se comunica con los vendedores                           |
| **ADMIN**      | Gestiona usuarios, cambia roles y consulta estadísticas globales                 |

---

## Estructura del proyecto

```
mercafacil/
├── mercafacil-backend/          # API REST + WebSocket (Spring Boot)
│   └── src/main/java/com/mercafacil/
│       ├── controller/          # Endpoints REST y STOMP
│       ├── service/             # Lógica de negocio
│       ├── repository/          # Acceso a datos (JPA)
│       ├── dto/                 # Objetos de transferencia
│       ├── model/               # Entidades JPA
│       └── security/            # JWT filter, ChannelInterceptor
│
├── mercafacil-frontend/         # SPA Angular 21
│   └── src/app/
│       ├── components/          # Componentes standalone por funcionalidad
│       ├── services/            # Lógica HTTP, WebSocket, estado
│       ├── guards/              # Protección de rutas por rol
│       └── interceptors/        # Adjunta el JWT en cada petición
│
└── docker-compose.yml           # MySQL + phpMyAdmin + backend + frontend
```

## Autor

**Rubén Maderas Moreno**  
2º DAW — Proyecto de Fin de Grado, 2025/2026
