# 🚀 QUICKSTART - Docker + MySQL

## Paso 1: Inicia Docker

```bash
cd c:\Users\Rubén\Desktop\mercafacil\mercafacil-backend
docker-compose up -d
```

## Paso 2: Verifica que todo está funcionando

```bash
# Ver estado de los contenedores
docker-compose ps

# Ver logs de MySQL (espera a que muestre "ready for connections")
docker-compose logs -f mysql
```

## Paso 3: Accede a phpMyAdmin

Abre en el navegador: **http://localhost:8081**

- Usuario: `mercafacil_user`
- Contraseña: `mercafacil_pass123`

Deberías ver la base de datos `mercafacil_db` con todas las tablas creadas.

## Paso 4: Verifica la conexión desde Spring Boot

```bash
# Compila el proyecto
mvn clean compile

# Ejecuta los tests (si existen)
mvn test

# Inicia la aplicación
mvn spring-boot:run
```

Si ves en logs que se conectó a MySQL, ¡está todo listo!

## 📝 Próximos pasos (Recomendados)

### 1️⃣ Convertir modelos a Entidades JPA
Los modelos Java necesitan anotaciones @Entity, @Id, @ManyToOne, etc.

### 2️⃣ Crear Repositorios (Spring Data JPA)
```java
public interface ProductRepository extends JpaRepository<Product, Integer> {
    List<Product> findByCategory(String category);
}
```

### 3️⃣ Crear Servicios
Mover la lógica del `MockDataLoader` a servicios que usen los repositorios.

### 4️⃣ Actualizar Controladores
Cambiar controladores para usar servicios en lugar de `MockDataLoader`.

## 🛠️ Comandos útiles

```bash
# Ver todas las tablas
docker-compose exec mysql mysql -umercafacil_user -pmercafacil_pass123 mercafacil_db -e "SHOW TABLES;"

# Hacer backup de la BD
docker-compose exec mysql mysqldump -umercafacil_user -pmercafacil_pass123 mercafacil_db > backup.sql

# Detener contenedores
docker-compose down

# Reiniciar BD desde cero (borra datos)
docker-compose down -v && docker-compose up -d
```

## ❓ Problemas?

- MySQL lento en iniciar: Espera 20 segundos y revisa logs
- phpMyAdmin no carga: Reinicia MySQL con `docker-compose restart mysql`
- Puertos ocupados: Edita puertos en `docker-compose.yml`
