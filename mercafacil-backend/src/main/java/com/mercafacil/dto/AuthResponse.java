package com.mercafacil.dto;

public record AuthResponse(
        Long   id,
        String token,
        String email,
        String nombre,
        String apellidos,
        String rol
) {}
