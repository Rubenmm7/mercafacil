package com.mercafacil.dto;

public record StoreAdminDto(
        Long id,
        String name,
        String address,
        String city,
        Long vendedorId,
        String vendedorNombre) {
}
