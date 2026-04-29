package com.mercafacil.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import com.mercafacil.dto.CartItemDto;
import com.mercafacil.dto.CartItemRequest;
import com.mercafacil.model.User;
import com.mercafacil.service.CartService;

@RestController
@RequestMapping("/api/cart")
public class CartController {

    private final CartService cartService;

    public CartController(CartService cartService) {
        this.cartService = cartService;
    }

    // Devuelve todos los items del carrito del usuario autenticado
    @GetMapping
    public List<CartItemDto> getCart(@AuthenticationPrincipal User user) {
        return cartService.getCart(user);
    }

    // Agrega un item al carrito (o incrementa cantidad si ya existe)
    @PostMapping("/items")
    public CartItemDto addItem(@AuthenticationPrincipal User user,
                               @RequestBody CartItemRequest req) {
        return cartService.addOrUpdate(user, req);
    }

    // Actualiza la cantidad de un item específico
    @PutMapping("/items/{productId}/{storeId}")
    public CartItemDto updateItem(@AuthenticationPrincipal User user,
                                  @PathVariable Long productId,
                                  @PathVariable Long storeId,
                                  @RequestBody QuantityBody body) {
        return cartService.updateQuantity(user, productId, storeId, body.quantity());
    }

    // Elimina un item del carrito
    @DeleteMapping("/items/{productId}/{storeId}")
    public ResponseEntity<Void> removeItem(@AuthenticationPrincipal User user,
                                           @PathVariable Long productId,
                                           @PathVariable Long storeId) {
        cartService.removeItem(user, productId, storeId);
        return ResponseEntity.noContent().build();
    }

    // Vacía el carrito completo del usuario
    @DeleteMapping
    public ResponseEntity<Void> clearCart(@AuthenticationPrincipal User user) {
        cartService.clearCart(user);
        return ResponseEntity.noContent().build();
    }

    // Fusiona el carrito local (invitado) con el del servidor tras el login
    @PostMapping("/merge")
    public List<CartItemDto> mergeCart(@AuthenticationPrincipal User user,
                                       @RequestBody List<CartItemRequest> items) {
        return cartService.mergeCart(user, items);
    }

    record QuantityBody(int quantity) {}
}
