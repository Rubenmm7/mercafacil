package com.mercafacil.controller;

import com.mercafacil.dto.AuthRequest;
import com.mercafacil.dto.AuthResponse;
import com.mercafacil.dto.RegisterRequest;
import com.mercafacil.model.User;
import com.mercafacil.security.JwtUtil;
import com.mercafacil.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authManager;
    private final UserService userService;
    private final JwtUtil jwtUtil;

    public AuthController(AuthenticationManager authManager, UserService userService, JwtUtil jwtUtil) {
        this.authManager = authManager;
        this.userService = userService;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody @Valid AuthRequest req) {
        authManager.authenticate(
                new UsernamePasswordAuthenticationToken(req.email(), req.password()));
        User user = userService.findByEmail(req.email());
        return ResponseEntity.ok(toResponse(user));
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody @Valid RegisterRequest req) {
        User user = userService.register(req);
        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(user));
    }

    private AuthResponse toResponse(User user) {
        return new AuthResponse(
                user.getId(),
                jwtUtil.generateToken(user),
                user.getEmail(),
                user.getNombre(),
                user.getApellidos(),
                user.getRol().name());
    }
}
