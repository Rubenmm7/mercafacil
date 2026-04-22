# Proyecto Final de Grado: Sistema Unificado de Compras - Centro Comercial

Plataforma de comercio electrónico multi-tienda para un centro comercial que permite compras centralizadas, seguimiento en tiempo real y comunicación directa entre roles.

## 🛠 Stack Tecnológico
- **Backend:** Java 21 con Spring Boot.
- **Frontend:** Angular (TypeScript).
- **Base de Datos:** MySQL (ejecutándose en Docker).
- **Seguridad:** JWT (JSON Web Tokens) para autenticación stateless.
- **Comunicación en Tiempo Real:** WebSockets (Socket.io/RxJS) para chat y tracking.
- **Mapas:** Google Maps API (ubicación de puestos y rutas de repartidores).

## 📋 Arquitectura y Roles
El sistema gestiona 5 perfiles de usuario:
1. **Admin:** Gestión de infraestructura, mapa del centro comercial y tiendas.
2. **Cliente:** Búsqueda global, carrito multi-tienda, historial y seguimiento.
3. **Vendedor:** Gestión de stock, productos, ofertas y chat con clientes.
4. **Repartidor:** Gestión de entregas, actualización de ubicación GPS en tiempo real.
5. **Proveedor:** Suministro de productos a vendedores.

## 🗄️ Esquema de Base de Datos (Resumen)
- `users`: id, nombre, apellidos, email, password, rol (ENUM).
- `shops`: id, nombre, vendedor_id, pos_x, pos_y (Coordenadas en plano CC).
- `products`: id, nombre, procedencia, precio, oferta, stock, shop_id.
- `orders`: id, cliente_id, repartidor_id, estado (pendiente, preparacion, en_ruta, entregado), total.
- `order_items`: id, order_id, product_id, cantidad, precio_unitario.
- `messages`: id, order_id, remitente_id, mensaje, fecha.
- `tracking`: id, order_id, latitud, longitud, ultima_actualizacion.

## ⚖️ Reglas de Negocio y Estándares
1. **Búsqueda Global:** El cliente debe poder buscar productos por nombre, procedencia (proximidad) y mejores ofertas en todo el centro comercial.
2. **Geofencing:** Implementar lógica para notificar al cliente cuando el repartidor esté cerca (simulado vía GPS).
3. **Seguimiento:** Los repartidores envían coordenadas vía WebSocket; el cliente las visualiza sobre la API de Google Maps.
4. **Seguridad:** Todas las rutas de API (excepto login/registro y búsqueda pública) deben estar protegidas por el filtro JWT validando el Rol.
5. **Código:**
   - Backend: Seguir arquitectura limpia (Controller, Service, Repository, DTO).
   - Frontend: Componentes modulares y servicios para la lógica de API.
   - Naming: Variables y métodos en inglés.

## 🛠 Tareas Prioritarias para Claude Code
- Implementar el CRUD de productos con filtros de procedencia.
- Configurar la seguridad JWT y los guards de Angular por rol.
- Desarrollar el sistema de chat basado en `order_id`.
- Integrar la lógica de tracking de pedidos en el mapa.