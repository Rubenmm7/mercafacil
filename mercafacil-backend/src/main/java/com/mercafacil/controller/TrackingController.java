package com.mercafacil.controller;

import com.mercafacil.dto.TrackingRequest;
import com.mercafacil.dto.TrackingResponse;
import com.mercafacil.model.User;
import com.mercafacil.service.TrackingService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tracking")
public class TrackingController {

    private final TrackingService trackingService;

    public TrackingController(TrackingService trackingService) {
        this.trackingService = trackingService;
    }

    // El repartidor envía su posición actual; se persiste y se emite por STOMP
    @PostMapping("/orders/{orderId}/location")
    @PreAuthorize("hasRole('REPARTIDOR')")
    public ResponseEntity<TrackingResponse> saveLocation(@PathVariable Long orderId,
                                                          @Valid @RequestBody TrackingRequest req,
                                                          @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(trackingService.saveLocation(orderId, req, user));
    }

    // Devuelve el historial completo de posiciones de un pedido (para futuro mapa)
    @GetMapping("/orders/{orderId}/history")
    public ResponseEntity<List<TrackingResponse>> getHistory(@PathVariable Long orderId) {
        return ResponseEntity.ok(trackingService.getHistory(orderId));
    }

    // Devuelve la última posición conocida del repartidor para un pedido
    @GetMapping("/orders/{orderId}/location")
    public ResponseEntity<TrackingResponse> getLastLocation(@PathVariable Long orderId) {
        return trackingService.getLastLocation(orderId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }
}
