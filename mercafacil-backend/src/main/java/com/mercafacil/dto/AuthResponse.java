package com.mercafacil.dto;

public record AuthResponse(
        String token,
        String email,
        String nombre,
        String apellidos,
        String rol
) {}
