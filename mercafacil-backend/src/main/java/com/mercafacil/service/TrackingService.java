package com.mercafacil.service;

import java.util.List;
import java.util.Objects;
import java.util.Optional;

import org.springframework.lang.NonNull;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mercafacil.dto.OrderStatusNotification;
import com.mercafacil.dto.TrackingRequest;
import com.mercafacil.dto.TrackingResponse;
import com.mercafacil.model.OrderStatus;
import com.mercafacil.model.Tracking;
import com.mercafacil.model.User;
import com.mercafacil.repository.OrderRepository;
import com.mercafacil.repository.TrackingRepository;
import com.mercafacil.util.DateTimeUtils;

/**
 * Servicio que gestiona el tracking (seguimiento GPS) de entregas en tiempo real.
 * 
 * Responsabilidades:
 * - Guardar ubicaciones GPS (llamadas desde repartidor o desde la simulación server-side).
 * - Publicar ubicaciones en WebSocket (/topic/tracking/order/{orderId}) en tiempo real.
 * - Obtener historial de ubicaciones de una entrega.
 * - Obtener la última ubicación conocida.
 * - Marcar pedidos como entregados y notificar vía WebSocket.
 * - Validar permisos: solo el repartidor asignado puede enviar su ubicación.
 */
@Service
@Transactional
public class TrackingService {

    private final TrackingRepository trackingRepository;
    private final OrderRepository orderRepository;
    // Plantilla de mensajería para publicar en WebSocket STOMP.
    private final SimpMessagingTemplate messaging;

    public TrackingService(TrackingRepository trackingRepository,
            OrderRepository orderRepository,
            SimpMessagingTemplate messaging) {
        this.trackingRepository = trackingRepository;
        this.orderRepository = orderRepository;
        this.messaging = messaging;
    }

    /**
     * Guarda la ubicación actual del repartidor (llamada desde el controlador REST).
     * Flujo:
     * 1. Valida y obtiene la entrega.
     * 2. Crea un registro Tracking con lat/lng.
     * 3. Publica en WebSocket para que el cliente lo vea en tiempo real.
     * 
     * @param orderId ID de la entrega.
     * @param req DTO con latitud y longitud.
     * @param repartidor Usuario autenticado (Spring Security).
     * @return DTO de respuesta con el tracking guardado.
     */
    public TrackingResponse saveLocation(Long orderId, TrackingRequest req, User repartidor) {
        Long safeOrderId = requireId(orderId, "orderId");
        var order = orderRepository.findById(safeOrderId)
                .orElseThrow(() -> new IllegalArgumentException("Pedido no encontrado: " + orderId));

        Long repartidorId = requireUserId(repartidor);
        Long asignadoId = order.getDeliverer() != null ? order.getDeliverer().getId() : null;
        if (!Objects.equals(asignadoId, repartidorId))
            throw new AccessDeniedException("No eres el repartidor asignado a este pedido");

        Tracking tracking = new Tracking();
        tracking.setOrder(order);
        tracking.setLatitud(req.latitud());
        tracking.setLongitud(req.longitud());
        Tracking saved = trackingRepository.save(tracking);

        // Usa orderId local para evitar navegar el proxy LAZY tras el save.
        TrackingResponse response = new TrackingResponse(
                saved.getId(), orderId, saved.getLatitud(), saved.getLongitud(),
                DateTimeUtils.toApiString(saved.getUltimaActualizacion()));

        // Publicar en WebSocket para que el cliente reciba la actualización en tiempo real.
        messaging.convertAndSend("/topic/tracking/order/" + orderId, Objects.requireNonNull(response));
        return response;
    }

    /**
     * Marca una entrega como ENTREGADO y notifica vía WebSocket.
     * 
     * Se llama automáticamente desde SimulacionGpsService cuando finaliza la simulación.
     * Solo marca como entregado si el estado actual es EN_RUTA.
     * 
     * Publica un evento en /topic/pedido/{orderId}/estado que el frontend recibe
     * para actualizar el estado visualmente sin necesidad de refrescar.
     * 
     * @param orderId ID de la entrega a marcar como entregada.
     */
    public void marcarComoEntregado(Long orderId) {
        Long safeId = requireId(orderId, "orderId");
        orderRepository.findById(safeId).ifPresent(order -> {
            if (order.getStatus() == OrderStatus.EN_RUTA) {
                order.setStatus(OrderStatus.ENTREGADO);
                order.setDeliveredAt(DateTimeUtils.nowMadrid());
                // Notificar a través de WebSocket el cambio de estado.
                messaging.convertAndSend("/topic/pedido/" + orderId + "/estado",
                        new OrderStatusNotification(orderId, "ENTREGADO"));
            }
        });
    }

    /**
     * Guarda ubicación interna (llamada desde SimulacionGpsService durante la simulación GPS).
     * 
     * Similar a saveLocation(), pero sin validar permisos (es interna del servidor).
     * Se usa para guardar cada tick de la simulación de ruta del repartidor.
     * 
     * @param orderId ID de la entrega.
     * @param lat Latitud.
     * @param lng Longitud.
     * @return DTO de respuesta con el tracking guardado.
     */
    public TrackingResponse saveLocationInterna(Long orderId, double lat, double lng) {
        Long safeOrderId = requireId(orderId, "orderId");
        var order = orderRepository.findById(safeOrderId)
                .orElseThrow(() -> new IllegalArgumentException("Pedido no encontrado: " + safeOrderId));

        Tracking tracking = new Tracking();
        tracking.setOrder(order);
        tracking.setLatitud(lat);
        tracking.setLongitud(lng);
        Tracking saved = trackingRepository.save(tracking);

        TrackingResponse response = new TrackingResponse(
                saved.getId(), safeOrderId, saved.getLatitud(), saved.getLongitud(),
                DateTimeUtils.toApiString(saved.getUltimaActualizacion()));

        // Publicar en WebSocket.
        messaging.convertAndSend("/topic/tracking/order/" + safeOrderId, Objects.requireNonNull(response));
        return response;
    }

    /**
     * Devuelve el historial completo de ubicaciones de una entrega, ordenadas por fecha (ascendente).
     * Solo lectura: no modifica datos.
     * 
     * @param orderId ID de la entrega.
     * @return Lista de trackings desde el más antiguo al más reciente.
     */
    @Transactional(readOnly = true)
    public List<TrackingResponse> getHistory(Long orderId) {
        return trackingRepository.findByOrder_IdOrderByUltimaActualizacionAsc(orderId)
                .stream().map(this::toResponse).toList();
    }

    /**
     * Devuelve la última ubicación registrada de una entrega.
     * Solo lectura: no modifica datos.
     * 
     * @param orderId ID de la entrega.
     * @return Optional con el último tracking, o vacío si no hay ninguno.
     */
    @Transactional(readOnly = true)
    public Optional<TrackingResponse> getLastLocation(Long orderId) {
        return trackingRepository.findTopByOrder_IdOrderByUltimaActualizacionDesc(orderId)
                .map(this::toResponse);
    }

    // Convierte entidad Tracking a DTO TrackingResponse.
    private TrackingResponse toResponse(Tracking t) {
        return new TrackingResponse(
                t.getId(),
                t.getOrder().getId(),
                t.getLatitud(),
                t.getLongitud(),
                DateTimeUtils.toApiString(t.getUltimaActualizacion()));
    }

    // Valida que un ID no sea null; lanza NullPointerException si es null.
    private @NonNull Long requireId(Long id, String fieldName) {
        return Objects.requireNonNull(id, fieldName + " no puede ser null");
    }

    // Valida que el usuario autenticado tenga ID.
    private @NonNull Long requireUserId(User user) {
        return Objects.requireNonNull(user.getId(), "El repartidor autenticado no tiene ID");
    }
}
