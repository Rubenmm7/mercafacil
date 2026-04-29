package com.mercafacil.dto;

import com.mercafacil.model.Role;

public record UserDto(
        Long id,
        String nombre,
        String apellidos,
        String email,
        Role rol
) {}
