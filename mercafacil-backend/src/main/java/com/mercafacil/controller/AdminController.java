package com.mercafacil.controller;

import java.util.List;
import java.util.Map;

import com.mercafacil.dto.UserPageDto;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.mercafacil.dto.AdminStatsDto;
import com.mercafacil.dto.AnalyticsDto;
import com.mercafacil.dto.AssignVendedorRequest;
import com.mercafacil.dto.CreateUserRequest;
import com.mercafacil.dto.StoreAdminDto;
import com.mercafacil.dto.UpdateUserRequest;
import com.mercafacil.dto.UserDto;
import com.mercafacil.model.Role;
import com.mercafacil.service.AdminService;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/stats")
    public ResponseEntity<AdminStatsDto> getStats() {
        return ResponseEntity.ok(adminService.getStats());
    }

    @GetMapping("/analytics")
    public ResponseEntity<AnalyticsDto> getAnalytics(@RequestParam(defaultValue = "7") int period) {
        return ResponseEntity.ok(adminService.getAnalytics(period));
    }

    @GetMapping("/users")
    public ResponseEntity<UserPageDto> getAllUsers(
            @RequestParam(defaultValue = "") String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sort,
            @RequestParam(defaultValue = "asc") String dir) {
        return ResponseEntity.ok(adminService.getUsersPage(search, page, size, sort, dir));
    }

    @PostMapping("/users")
    public ResponseEntity<UserDto> createUser(@RequestBody CreateUserRequest req) {
        return ResponseEntity.ok(adminService.createUser(req));
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<UserDto> updateUser(@PathVariable Long id,
            @RequestBody UpdateUserRequest req) {
        return ResponseEntity.ok(adminService.updateUser(id, req));
    }

    @PutMapping("/users/{id}/role")
    public ResponseEntity<UserDto> changeRole(@PathVariable Long id,
            @RequestBody Map<String, String> body) {
        if (id == null) {
            throw new IllegalArgumentException("User ID cannot be null");
        }
        Role newRole = Role.valueOf(body.get("rol"));
        return ResponseEntity.ok(adminService.changeRole(id, newRole));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        if (id == null) {
            throw new IllegalArgumentException("User ID cannot be null");
        }
        adminService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/stores")
    public ResponseEntity<List<StoreAdminDto>> getStores() {
        return ResponseEntity.ok(adminService.getStores());
    }

    @PutMapping("/stores/{storeId}/vendedor")
    public ResponseEntity<StoreAdminDto> assignVendedor(@PathVariable Long storeId,
            @RequestBody AssignVendedorRequest req) {
        return ResponseEntity.ok(adminService.assignVendedor(storeId, req));
    }
}
