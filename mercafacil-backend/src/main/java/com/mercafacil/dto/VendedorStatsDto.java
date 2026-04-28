package com.mercafacil.dto;

public record VendedorStatsDto(
    int totalStores,
    long pendingOrders,
    long lowStockOffers,
    double todayRevenue
) {}
