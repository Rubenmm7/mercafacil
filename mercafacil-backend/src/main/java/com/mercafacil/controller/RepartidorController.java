package com.mercafacil.controller;

import com.mercafacil.dto.OrderResponse;
import com.mercafacil.dto.RepartidorStatsDto;
import com.mercafacil.model.User;
import com.mercafacil.service.RepartidorService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/repartidor")
@PreAuthorize("hasRole('REPARTIDOR')")
public class RepartidorController {

    private final RepartidorService repartidorService;

    public RepartidorController(RepartidorService repartidorService) {
        this.repartidorService = repartidorService;
    }

    @GetMapping("/stats")
    public ResponseEntity<RepartidorStatsDto> getStats(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(repartidorService.getStats(user));
    }

    @GetMapping("/orders")
    public ResponseEntity<List<OrderResponse>> getMyOrders(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(repartidorService.getMyOrders(user));
    }

    @GetMapping("/orders/available")
    public ResponseEntity<List<OrderResponse>> getAvailableOrders() {
        return ResponseEntity.ok(repartidorService.getAvailableOrders());
    }

    @PatchMapping("/orders/{id}/accept")
    public ResponseEntity<OrderResponse> acceptOrder(@PathVariable Long id,
                                                     @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(repartidorService.acceptOrder(id, user));
    }

    @PatchMapping("/orders/{id}/status")
    public ResponseEntity<OrderResponse> updateOrderStatus(@PathVariable Long id,
                                                           @RequestBody Map<String, String> body,
                                                           @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(repartidorService.updateOrderStatus(id, body.get("status"), user));
    }
}
