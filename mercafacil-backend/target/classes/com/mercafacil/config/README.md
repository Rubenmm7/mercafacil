# Configuración del Backend

## 📋 Archivos de Configuración

### CorsConfig.java
Configura **CORS** (Cross-Origin Resource Sharing) para permitir que el frontend acceda a la API.

**Mejoras aplicadas:**
- ✅ Orígenes configurables desde `application.properties`
- ✅ Soporta múltiples orígenes (separados por comas)
- ✅ Incluye método PATCH y OPTIONS
- ✅ Permite credenciales (cookies, tokens)
- ✅ Cache de preflight (3600 segundos)

**Cómo usar:**

En desarrollo (localhost):
```properties
cors.allowed-origins=http://localhost:4200,http://localhost:3000
```

En producción:
```properties
cors.allowed-origins=https://mercafacil.com,https://www.mercafacil.com
```

### Application.properties
Configuración global de la aplicación:
- **Base de datos**: MySQL en localhost:3306
- **JPA/Hibernate**: Validación del schema
- **Logging**: DEBUG para el paquete `com.mercafacil`
- **CORS**: Orígenes permitidos

## 🔧 Próximos pasos

1. **Seguridad**: Añadir Spring Security si es necesario
2. **Error Handling**: Centralizar manejo de excepciones
3. **Documentación**: Agregar Swagger/OpenAPI
4. **Actuator**: Metrics y health checks
