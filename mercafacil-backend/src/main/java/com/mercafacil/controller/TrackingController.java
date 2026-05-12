package com.mercafacil.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mercafacil.dto.TrackingRequest;
import com.mercafacil.dto.TrackingResponse;
import com.mercafacil.model.User;
import com.mercafacil.service.TrackingService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/tracking")
public class TrackingController {

    private final TrackingService trackingService;

    public TrackingController(TrackingService trackingService) {
        this.trackingService = trackingService;
    }

    @PostMapping("/orders/{orderId}/location")
    @PreAuthorize("hasRole('REPARTIDOR')")
    public ResponseEntity<TrackingResponse> saveLocation(@PathVariable Long orderId,
            @Valid @RequestBody TrackingRequest req,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(trackingService.saveLocation(orderId, req, user));
    }

    @GetMapping("/orders/{orderId}/history")
    public ResponseEntity<List<TrackingResponse>> getHistory(@PathVariable Long orderId) {
        return ResponseEntity.ok(trackingService.getHistory(orderId));
    }

    @GetMapping("/orders/{orderId}/location")
    public ResponseEntity<TrackingResponse> getLastLocation(@PathVariable Long orderId) {
        return trackingService.getLastLocation(orderId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }
}
