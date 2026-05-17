package com.mercafacil.controller;

import com.mercafacil.dto.EnvioStockDto;
import com.mercafacil.dto.ProveedorStatsDto;
import com.mercafacil.dto.ReponerRequest;
import com.mercafacil.dto.StoreDto;
import com.mercafacil.dto.StoreOfferDto;
import com.mercafacil.model.User;
import com.mercafacil.service.ProveedorService;
import com.mercafacil.service.StockReposicionService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/proveedor")
@PreAuthorize("hasRole('PROVEEDOR')")
public class ProveedorController {

    private final ProveedorService proveedorService;
    private final StockReposicionService stockReposicionService;

    public ProveedorController(ProveedorService proveedorService,
            StockReposicionService stockReposicionService) {
        this.proveedorService = proveedorService;
        this.stockReposicionService = stockReposicionService;
    }

    @GetMapping("/stats")
    public ResponseEntity<ProveedorStatsDto> getStats(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(proveedorService.getStats(user));
    }

    @GetMapping("/stores")
    public ResponseEntity<List<StoreDto>> getAllStores() {
        return ResponseEntity.ok(proveedorService.getAllStores());
    }

    @GetMapping("/stores/{storeId}/offers")
    public ResponseEntity<List<StoreOfferDto>> getStoreOffers(@PathVariable Long storeId) {
        return ResponseEntity.ok(proveedorService.getStoreOffers(storeId));
    }

    @PostMapping("/stock/reponer")
    public ResponseEntity<EnvioStockDto> reponer(@RequestBody ReponerRequest req) {
        return ResponseEntity.ok(stockReposicionService.reponer(req));
    }

    @GetMapping("/stock/envios")
    public ResponseEntity<List<EnvioStockDto>> getEnviosEnCurso() {
        return ResponseEntity.ok(stockReposicionService.getEnviosEnCurso());
    }
}
