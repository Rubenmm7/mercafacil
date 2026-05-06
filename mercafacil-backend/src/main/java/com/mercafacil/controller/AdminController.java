package com.mercafacil.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mercafacil.dto.AdminStatsDto;
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

    @GetMapping("/users")
    public ResponseEntity<List<UserDto>> getAllUsers() {
        return ResponseEntity.ok(adminService.getAllUsers());
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
}
