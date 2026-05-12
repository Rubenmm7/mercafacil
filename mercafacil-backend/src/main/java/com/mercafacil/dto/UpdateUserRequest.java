package com.mercafacil.dto;

import com.mercafacil.model.Role;

public record UpdateUserRequest(
                String nombre,
                String apellidos,
                String email,
                String password,
                Role rol) {
}
