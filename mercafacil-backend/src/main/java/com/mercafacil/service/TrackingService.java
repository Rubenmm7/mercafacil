package com.mercafacil.service;

import java.util.List;
import java.util.Objects;
import java.util.Optional;

import org.springframework.lang.NonNull;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mercafacil.dto.TrackingRequest;
import com.mercafacil.dto.TrackingResponse;
import com.mercafacil.model.Tracking;
import com.mercafacil.model.User;
import com.mercafacil.repository.OrderRepository;
import com.mercafacil.repository.TrackingRepository;
import com.mercafacil.util.DateTimeUtils;

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
        this.orderRepository = orderRepository;
        this.messaging = messaging;
    }

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

        messaging.convertAndSend("/topic/tracking/order/" + orderId, Objects.requireNonNull(response));
        return response;
    }

    @Transactional(readOnly = true)
    public List<TrackingResponse> getHistory(Long orderId) {
        return trackingRepository.findByOrder_IdOrderByUltimaActualizacionAsc(orderId)
                .stream().map(this::toResponse).toList();
    }

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
                DateTimeUtils.toApiString(t.getUltimaActualizacion()));
    }

    private @NonNull Long requireId(Long id, String fieldName) {
        return Objects.requireNonNull(id, fieldName + " no puede ser null");
    }

    private @NonNull Long requireUserId(User user) {
        return Objects.requireNonNull(user.getId(), "El repartidor autenticado no tiene ID");
    }
}
