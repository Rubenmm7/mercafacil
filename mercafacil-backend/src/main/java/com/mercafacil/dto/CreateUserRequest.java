package com.mercafacil.dto;

import com.mercafacil.model.Role;

public record CreateUserRequest(
                String nombre,
                String apellidos,
                String email,
                String password,
                Role rol) {
}
