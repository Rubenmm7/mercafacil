package com.mercafacil.service;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.atomic.AtomicInteger;

import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.stereotype.Service;

import com.mercafacil.model.Order;
import com.mercafacil.model.OrderStatus;
import com.mercafacil.repository.OrderRepository;

/**
 * Servicio que simula el movimiento GPS del repartidor en tiempo real.
 * 
 * Responsabilidades:
 * - Calcular waypoints (puntos de ruta) basados en el código postal de destino.
 * - Ejecutar ticks periódicos (cada 30 segundos) que avanzan la simulación y publican
 *   la posición actual vía WebSocket al frontend.
 * - Permitir que el frontend envíe rutas reales calculadas por Google Maps DirectionsService,
 *   remuestra rlas a los pasos estimados y las usa en la simulación.
 * - Auto-marcar como ENTREGADO 60 segundos después de llegar al destino.
 * - Reanudar simulaciones en progreso al reiniciar el servidor.
 * 
 * Flujo típico:
 * 1. RepartidorService.updateOrderStatus(orderId, EN_RUTA) → iniciarSimulacion(order)
 * 2. Frontend recibe EN_RUTA → calcula ruta real → POST /api/tracking/orders/{id}/route
 * 3. setRuta() guarda la ruta remuestreada.
 * 4. Timer usa la ruta real (o fallback lineal si aún no llegó).
 * 5. Al alcanzar el último waypoint → detenerSimulacion() + programar auto-entrega en 60s.
 */
@Service
public class SimulacionGpsService {

    // Coordenadas del centro comercial de origen.
    private static final double MALL_LAT = 37.7906159;
    private static final double MALL_LNG = -3.7740386;
    
    // Intervalo de cada tick de simulación (segundos).
    private static final long STEP_SECONDS = 30;

    // Tareas activas por orderId: ScheduledFuture para controlar y cancelar el timer.
    private final Map<Long, ScheduledFuture<?>> tareasActivas = new ConcurrentHashMap<>();
    
    // Rutas reales (si el frontend las proporcionó) por orderId.
    private final Map<Long, List<double[]>> rutasReales = new ConcurrentHashMap<>();
    
    // Número total de pasos estimados para cada orderId.
    private final Map<Long, Integer> pasosSimulacion = new ConcurrentHashMap<>();
    
    // Inyecciones de servicios.
    private final TrackingService trackingService;
    private final TaskScheduler taskScheduler;
    private final OrderRepository orderRepository;
    
    // Generador de números aleatorios para destinos fallback.
    private final Random random = new Random();

    public SimulacionGpsService(TrackingService trackingService,
            TaskScheduler taskScheduler,
            OrderRepository orderRepository) {
        this.trackingService = trackingService;
        this.taskScheduler = taskScheduler;
        this.orderRepository = orderRepository;
    }

    /**
     * Inicia la simulación GPS para una entrega en estado EN_RUTA.
     * 
     * 1. Cancela cualquier simulación anterior para este orderId.
     * 2. Resuelve destino: usa deliveryLat/Lng si existen, si no genera uno aleatorio cercano.
     * 3. Estima el número total de pasos según el código postal.
     * 4. Calcula una ruta fallback (lineal) por si el frontend no envía ruta real.
     * 5. Programa un timer que ejecuta ticks cada 30 segundos.
     * 6. Cuando se alcanzan todos los waypoints, detiene el timer y programa auto-entrega en 60s.
     */
    public void iniciarSimulacion(Order order) {
        long orderId = order.getId();
        detenerSimulacion(orderId);

        // Resolver destino: usar coordenadas de la BD si existen, si no generar aleatorio.
        Double deliveryLatObj = order.getDeliveryLat();
        Double deliveryLngObj = order.getDeliveryLng();
        double destLat = deliveryLatObj != null
                ? deliveryLatObj
                : MALL_LAT + (random.nextDouble() - 0.5) * 0.04;
        double destLng = deliveryLngObj != null
                ? deliveryLngObj
                : MALL_LNG + (random.nextDouble() - 0.5) * 0.04;

        // Estimar pasos totales según código postal.
        int totalSteps = estimarPasos(order);
        pasosSimulacion.put(orderId, totalSteps);
        
        // Calcular ruta lineal como fallback (si frontend no envía ruta real).
        List<double[]> fallback = computeWaypoints(MALL_LAT, MALL_LNG, destLat, destLng, totalSteps);
        AtomicInteger step = new AtomicInteger(0);

        // Programar timer que ejecuta cada 30 segundos.
        ScheduledFuture<?> future = taskScheduler.scheduleAtFixedRate(() -> {
            // Usar ruta real si ya llegó del frontend, si no usar fallback lineal.
            List<double[]> waypoints = rutasReales.getOrDefault(orderId, fallback);
            int currentStep = step.getAndIncrement();
            
            // Si se alcanzaron todos los waypoints: detener timer y programar auto-entrega en 60s.
            if (currentStep >= waypoints.size()) {
                detenerSimulacion(orderId);
                taskScheduler.schedule(
                        () -> trackingService.marcarComoEntregado(orderId),
                        Objects.requireNonNull(Instant.now().plusSeconds(60)));
                return;
            }
            
            // Guardar ubicación actual en BD y publicar vía WebSocket.
            double[] point = waypoints.get(currentStep);
            trackingService.saveLocationInterna(orderId, point[0], point[1]);
        }, Objects.requireNonNull(Instant.now()), Objects.requireNonNull(Duration.ofSeconds(STEP_SECONDS)));

        tareasActivas.put(orderId, future);
    }

    /**
     * Detiene la simulación de una entrega:
     * - Cancela el timer.
     * - Limpia datos cacheados (ruta real, número de pasos).
     */
    public void detenerSimulacion(Long orderId) {
        ScheduledFuture<?> future = tareasActivas.remove(orderId);
        if (future != null) {
            future.cancel(false);
        }
        rutasReales.remove(orderId);
        pasosSimulacion.remove(orderId);
    }

    /**
     * Guarda la ruta real (enviada por el frontend) y la remuestrea al número exacto de pasos.
     * 
     * El frontend calcula la ruta real con Google Maps DirectionsService y envía un array
     * de puntos (lat, lng). Este método remuestrea ese array al número de pasos estimados
     * para que coincida con la duración esperada y se use en la simulación.
     * 
     * @param orderId ID de la entrega.
     * @param rawWaypoints Array de puntos [lat, lng] de la ruta real.
     */
    public void setRuta(Long orderId, List<double[]> rawWaypoints) {
        // Obtener número de pasos ya estimado, o usar tamaño de ruta - 1 como fallback.
        int steps = pasosSimulacion.getOrDefault(orderId, rawWaypoints.size() - 1);
        // Remuestrear y guardar.
        rutasReales.put(orderId, resamplearRuta(rawWaypoints, steps));
    }

    /**
     * Hook que se ejecuta al arrancar la aplicación.
     * Retoma todas las entregas EN_RUTA que estaban en progreso antes del reinicio
     * y reinicia su simulación (con ruta lineal, la ruta real se perdió al reiniciar).
     */
    @EventListener(ApplicationReadyEvent.class)
    public void reanudarSimulaciones() {
        List<Order> enRuta = orderRepository.findByStatus(OrderStatus.EN_RUTA);
        for (Order order : enRuta) {
            iniciarSimulacion(order);
        }
    }

    /**
     * Estima el número de pasos (ticks) necesarios basándose en el código postal de destino.
     * 
     * Lógica:
     * - Si CP empieza con 230 (Jaén centro): 14-18 minutos según últimos dos dígitos.
     * - Si CP 231-235: 19-23 minutos.
     * - Por defecto: 18 minutos.
     * 
     * @param order Entrega con CP y dirección.
     * @return Número de pasos calculado.
     */
    private int estimarPasos(Order order) {
        String cp = order.getPostalCode();
        
        // Si no hay CP en la BD, intentar extraerlo de la dirección de envío.
        if (cp == null && order.getShippingAddress() != null) {
            java.util.regex.Matcher m = java.util.regex.Pattern.compile("\\b(\\d{5})\\b")
                    .matcher(order.getShippingAddress());
            if (m.find()) cp = m.group(1);
        }
        
        // Estimar minutos según CP.
        int minutos = 18;
        if (cp != null) {
            String clean = cp.replaceAll("\\D", "");
            if (clean.startsWith("230") && clean.length() >= 5) {
                int lastTwo = Integer.parseInt(clean.substring(3, 5));
                if (lastTwo <= 19)      minutos = 14;
                else if (lastTwo <= 39) minutos = 15;
                else if (lastTwo <= 59) minutos = 16;
                else if (lastTwo <= 79) minutos = 17;
                else                   minutos = 18;
            } else if (clean.startsWith("231")) minutos = 19;
            else if (clean.startsWith("232"))   minutos = 20;
            else if (clean.startsWith("233"))   minutos = 21;
            else if (clean.startsWith("234"))   minutos = 22;
            else if (clean.startsWith("235"))   minutos = 23;
        }
        return (int) Math.ceil((minutos * 60.0) / STEP_SECONDS);
    }

    /**
     * Calcula una ruta lineal (interpolación simple) entre dos puntos.
     * 
     * Devuelve un array de `steps + 1` puntos interpolados linealmente.
     * Usado como fallback si el frontend no envía ruta real.
     * 
     * @param startLat Latitud inicial.
     * @param startLng Longitud inicial.
     * @param endLat Latitud final.
     * @param endLng Longitud final.
     * @param steps Número de pasos (intervalos).
     * @return Lista de [lat, lng] interpolados.
     */
    private List<double[]> computeWaypoints(double startLat, double startLng,
            double endLat, double endLng, int steps) {
        List<double[]> points = new ArrayList<>(steps + 1);
        for (int i = 0; i <= steps; i++) {
            double ratio = (double) i / steps;
            double lat = startLat + (endLat - startLat) * ratio;
            double lng = startLng + (endLng - startLng) * ratio;
            points.add(new double[] { lat, lng });
        }
        return points;
    }

    /**
     * Remuestrea una ruta (posiblemente con muchos puntos) a exactamente `steps` puntos.
     * 
     * Usa interpolación lineal en el espacio del índice: calcula la posición exacta
     * en la ruta original para cada paso destino y interpola entre puntos vecinos.
     * 
     * Esto permite que rutas reales detalladas (cientos de puntos de Google Maps)
     * se adapten al número exacto de pasos estimados sin perder forma.
     * 
     * @param ruta Lista de puntos originales [lat, lng].
     * @param steps Número de pasos destino (+ 1 para incluir inicio y fin).
     * @return Lista remuestreada con `steps + 1` puntos.
     */
    private List<double[]> resamplearRuta(List<double[]> ruta, int steps) {
        List<double[]> result = new ArrayList<>(steps + 1);
        for (int i = 0; i <= steps; i++) {
            // Calcular qué índice exacto de la ruta original corresponde a este paso.
            double ratio = (double) i / steps;
            double exactIndex = ratio * (ruta.size() - 1);
            
            // Encontrar índices enteros anterior y siguiente.
            int lo = (int) exactIndex;
            int hi = Math.min(lo + 1, ruta.size() - 1);
            
            // Interpolar linealmente entre los dos puntos.
            double frac = exactIndex - lo;
            double lat = ruta.get(lo)[0] + (ruta.get(hi)[0] - ruta.get(lo)[0]) * frac;
            double lng = ruta.get(lo)[1] + (ruta.get(hi)[1] - ruta.get(lo)[1]) * frac;
            result.add(new double[] { lat, lng });
        }
        return result;
    }
}
