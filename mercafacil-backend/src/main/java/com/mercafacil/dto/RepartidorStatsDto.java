package com.mercafacil.dto;

public record RepartidorStatsDto(
        int  myOrders,
        long pendingPool,
        long enRutaCount,
        long deliveredToday
) {}
