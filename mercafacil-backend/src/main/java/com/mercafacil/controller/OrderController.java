package com.mercafacil.controller;

import com.mercafacil.dto.OrderRequest;
import com.mercafacil.dto.OrderResponse;
import com.mercafacil.model.User;
import com.mercafacil.service.OrderService;
import com.mercafacil.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;
    private final UserService userService;

    public OrderController(OrderService orderService, UserService userService) {
        this.orderService = orderService;
        this.userService = userService;
    }

    @PostMapping
    public ResponseEntity<OrderResponse> create(@RequestBody @Valid OrderRequest req,
                                                @AuthenticationPrincipal UserDetails principal) {
        User user = userService.findByEmail(principal.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED).body(orderService.create(req, user));
    }

    @GetMapping("/my")
    public ResponseEntity<List<OrderResponse>> myOrders(@AuthenticationPrincipal UserDetails principal) {
        User user = userService.findByEmail(principal.getUsername());
        return ResponseEntity.ok(orderService.findByClient(user));
    }

    @GetMapping
    public ResponseEntity<List<OrderResponse>> allOrders() {
        return ResponseEntity.ok(orderService.findAll());
    }
}
