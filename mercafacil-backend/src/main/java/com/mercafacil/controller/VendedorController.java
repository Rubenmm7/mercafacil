package com.mercafacil.controller;

import com.mercafacil.dto.*;
import com.mercafacil.model.User;
import com.mercafacil.service.VendedorService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/vendedor")
@PreAuthorize("hasRole('VENDEDOR')")
public class VendedorController {

    private final VendedorService vendedorService;

    public VendedorController(VendedorService vendedorService) {
        this.vendedorService = vendedorService;
    }

    // --- Estadísticas ---

    @GetMapping("/stats")
    public ResponseEntity<VendedorStatsDto> getStats(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(vendedorService.getStats(user));
    }

    // --- Tiendas ---

    @GetMapping("/stores")
    public ResponseEntity<List<StoreDto>> getMyStores(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(vendedorService.getMyStores(user));
    }

    // --- Pedidos ---

    @GetMapping("/orders")
    public ResponseEntity<List<OrderResponse>> getMyOrders(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(vendedorService.getMyOrders(user));
    }

    @PatchMapping("/orders/{id}/status")
    public ResponseEntity<OrderResponse> updateOrderStatus(@PathVariable Long id,
                                                           @RequestBody Map<String, String> body,
                                                           @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(vendedorService.updateOrderStatus(id, body.get("status"), user));
    }

    // --- Productos ---

    @GetMapping("/products")
    public ResponseEntity<List<ProductDto>> getMyProducts(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(vendedorService.getMyProducts(user));
    }

    @PostMapping("/products")
    public ResponseEntity<ProductDto> createProduct(@RequestBody ProductRequest req,
                                                    @RequestParam Long storeId,
                                                    @AuthenticationPrincipal User user) {
        return ResponseEntity.status(HttpStatus.CREATED).body(vendedorService.createProduct(req, storeId, user));
    }

    @PutMapping("/products/{id}")
    public ResponseEntity<ProductDto> updateProduct(@PathVariable Long id,
                                                    @RequestBody ProductRequest req,
                                                    @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(vendedorService.updateProduct(id, req, user));
    }

    @DeleteMapping("/products/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id,
                                              @AuthenticationPrincipal User user) {
        vendedorService.deleteProduct(id, user);
        return ResponseEntity.noContent().build();
    }

    // --- Ofertas ---

    @GetMapping("/stores/{storeId}/offers")
    public ResponseEntity<List<StoreOfferDto>> getOffersByStore(@PathVariable Long storeId,
                                                                @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(vendedorService.getOffersByStore(storeId, user));
    }

    @GetMapping("/offers/low-stock")
    public ResponseEntity<List<StoreOfferDto>> getLowStockOffers(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(vendedorService.getLowStockOffers(user));
    }

    @PutMapping("/offers/{id}")
    public ResponseEntity<StoreOfferDto> updateOffer(@PathVariable Long id,
                                                     @RequestBody StoreOfferRequest req,
                                                     @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(vendedorService.updateOffer(id, req, user));
    }
}
