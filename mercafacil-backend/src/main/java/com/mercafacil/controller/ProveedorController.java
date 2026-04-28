package com.mercafacil.controller;

import com.mercafacil.dto.ProveedorStatsDto;
import com.mercafacil.dto.StoreDto;
import com.mercafacil.model.User;
import com.mercafacil.service.ProveedorService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/proveedor")
@PreAuthorize("hasRole('PROVEEDOR')")
public class ProveedorController {

    private final ProveedorService proveedorService;

    public ProveedorController(ProveedorService proveedorService) {
        this.proveedorService = proveedorService;
    }

    @GetMapping("/stats")
    public ResponseEntity<ProveedorStatsDto> getStats(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(proveedorService.getStats(user));
    }

    @GetMapping("/stores")
    public ResponseEntity<List<StoreDto>> getAllStores() {
        return ResponseEntity.ok(proveedorService.getAllStores());
    }
}
