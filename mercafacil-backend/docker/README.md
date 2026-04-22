# Docker Setup - MercaFácil Backend

Este directorio contiene la configuración de Docker para levantar la base de datos MySQL y phpMyAdmin.

## 📋 Contenido

- **docker-compose.yml**: Orquestación de servicios (MySQL + phpMyAdmin)
- **docker/init/schema.sql**: Estructura de la base de datos (tablas y índices)
- **docker/init/data.sql**: Datos iniciales (inserts)

## 🚀 Cómo usar

### Requisitos
- Docker Desktop instalado
- Docker Compose (incluido en Docker Desktop)

### Iniciar los servicios

```bash
# Posiciónate en la raíz del proyecto
cd c:\Users\Rubén\Desktop\mercafacil\mercafacil-backend

# Levanta los contenedores
docker-compose up -d
```

### Acceder a los servicios

**MySQL**
- Host: `localhost`
- Puerto: `3306`
- Usuario: `mercafacil_user`
- Contraseña: `mercafacil_pass123`
- Base de datos: `mercafacil_db`

**phpMyAdmin**
- URL: `http://localhost:8081`
- Usuario: `mercafacil_user`
- Contraseña: `mercafacil_pass123`

### Detener los servicios

```bash
docker-compose down
```

### Ver logs

```bash
# Todos los servicios
docker-compose logs -f

# Solo MySQL
docker-compose logs -f mysql

# Solo phpMyAdmin
docker-compose logs -f phpmyadmin
```

### Eliminar todo (contenedores + volúmenes)

```bash
docker-compose down -v
```

## 📦 Volúmenes

- `mysql_data`: Almacena la información de MySQL de forma persistente

## 🗄️ Estructura de la Base de Datos

### Tablas principales

1. **categories**: Categorías de productos
2. **stores**: Supermercados
3. **products**: Productos
4. **store_offers**: Ofertas de productos en tiendas (relación N:M)
5. **delivery_zones**: Zonas de entrega por tienda

## 🔧 Conectar desde el Backend Spring Boot

Actualiza el `application.properties`:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/mercafacil_db
spring.datasource.username=mercafacil_user
spring.datasource.password=mercafacil_pass123
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver

spring.jpa.database-platform=org.hibernate.dialect.MySQL8Dialect
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.show-sql=false
```

## ⚠️ Notas importantes

- Los datos se inicializan automáticamente cuando se levanta MySQL por primera vez
- Si necesitas reinicializar la BD, ejecuta `docker-compose down -v` y luego `docker-compose up -d`
- Los cambios en `schema.sql` y `data.sql` solo aplican cuando se crea el volumen por primera vez

## 🛠️ Solución de problemas

### MySQL no inicia
```bash
# Reinicia el contenedor
docker-compose restart mysql

# O reconstruye desde cero
docker-compose down -v
docker-compose up -d
```

### phpMyAdmin no conecta
- Espera 10-15 segundos a que MySQL esté listo
- Verifica los logs: `docker-compose logs mysql`

### Puerto en uso
Si los puertos 3306 u 8081 están en uso:
- Edita `docker-compose.yml` y cambia los puertos
- O detén el servicio que está usando ese puerto
