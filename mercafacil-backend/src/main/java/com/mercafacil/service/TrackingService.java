package com.mercafacil.service;

import com.mercafacil.dto.TrackingRequest;
import com.mercafacil.dto.TrackingResponse;
import com.mercafacil.model.Tracking;
import com.mercafacil.model.User;
import com.mercafacil.repository.OrderRepository;
import com.mercafacil.repository.TrackingRepository;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;
import java.util.Optional;

@Service
@Transactional
public class TrackingService {

    private final TrackingRepository trackingRepository;
    private final OrderRepository orderRepository;
    private final SimpMessagingTemplate messaging;

    public TrackingService(TrackingRepository trackingRepository,
                           OrderRepository orderRepository,
                           SimpMessagingTemplate messaging) {
        this.trackingRepository = trackingRepository;
        this.orderRepository    = orderRepository;
        this.messaging          = messaging;
    }

    // Guarda una nueva posición GPS y la emite en tiempo real por STOMP
    public TrackingResponse saveLocation(Long orderId, TrackingRequest req, User repartidor) {
        var order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Pedido no encontrado: " + orderId));

        // Solo el repartidor asignado al pedido puede enviar su ubicación
        Long repartidorId = Objects.requireNonNull(repartidor.getId(), "El repartidor autenticado no tiene ID");
        Long asignadoId = order.getDeliverer() != null ? order.getDeliverer().getId() : null;
        if (!Objects.equals(asignadoId, repartidorId))
            throw new AccessDeniedException("No eres el repartidor asignado a este pedido");

        Tracking tracking = new Tracking();
        tracking.setOrder(order);
        tracking.setLatitud(req.latitud());
        tracking.setLongitud(req.longitud());
        Tracking saved = trackingRepository.save(tracking);

        // Construye la respuesta usando orderId local para evitar navegar el proxy LAZY
        TrackingResponse response = new TrackingResponse(
                saved.getId(), orderId, saved.getLatitud(), saved.getLongitud(), saved.getUltimaActualizacion());

        // Publica la posición en tiempo real a todos los suscriptores del pedido
        messaging.convertAndSend("/topic/tracking/order/" + orderId, Objects.requireNonNull(response));
        return response;
    }

    // Devuelve el historial completo de posiciones de un pedido (orden cronológico)
    @Transactional(readOnly = true)
    public List<TrackingResponse> getHistory(Long orderId) {
        return trackingRepository.findByOrder_IdOrderByUltimaActualizacionAsc(orderId)
                .stream().map(this::toResponse).toList();
    }

    // Devuelve la última posición registrada para un pedido
    @Transactional(readOnly = true)
    public Optional<TrackingResponse> getLastLocation(Long orderId) {
        return trackingRepository.findTopByOrder_IdOrderByUltimaActualizacionDesc(orderId)
                .map(this::toResponse);
    }

    private TrackingResponse toResponse(Tracking t) {
        return new TrackingResponse(
                t.getId(),
                t.getOrder().getId(),
                t.getLatitud(),
                t.getLongitud(),
                t.getUltimaActualizacion()
        );
    }
}
