package com.mercafacil.dto;

public record AdminStatsDto(
        long totalUsers,
        long totalStores,
        long totalOrders,
        long clienteCount,
        long vendedorCount,
        long repartidorCount,
        long proveedorCount,
        long adminCount
) {}
