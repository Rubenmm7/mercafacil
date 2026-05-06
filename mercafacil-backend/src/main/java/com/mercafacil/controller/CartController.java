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

    @GetMapping
    public List<CartItemDto> getCart(@AuthenticationPrincipal User user) {
        return cartService.getCart(user);
    }

    @PostMapping("/items")
    public CartItemDto addItem(@AuthenticationPrincipal User user,
                               @RequestBody CartItemRequest req) {
        return cartService.addOrUpdate(user, req);
    }

    @PutMapping("/items/{productId}/{storeId}")
    public CartItemDto updateItem(@AuthenticationPrincipal User user,
                                  @PathVariable Long productId,
                                  @PathVariable Long storeId,
                                  @RequestBody QuantityBody body) {
        return cartService.updateQuantity(user, productId, storeId, body.quantity());
    }

    @DeleteMapping("/items/{productId}/{storeId}")
    public ResponseEntity<Void> removeItem(@AuthenticationPrincipal User user,
                                           @PathVariable Long productId,
                                           @PathVariable Long storeId) {
        cartService.removeItem(user, productId, storeId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping
    public ResponseEntity<Void> clearCart(@AuthenticationPrincipal User user) {
        cartService.clearCart(user);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/merge")
    public List<CartItemDto> mergeCart(@AuthenticationPrincipal User user,
                                       @RequestBody List<CartItemRequest> items) {
        return cartService.mergeCart(user, items);
    }

    // DTO interno para deserializar { "quantity": N } en updateItem.
    record QuantityBody(int quantity) {}
}
