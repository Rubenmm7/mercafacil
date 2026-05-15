package com.mercafacil.dto;

import java.util.List;

public record AnalyticsDto(
    List<DayStatDto> dailyOrders,
    List<ProductStatDto> topProducts,
    List<StoreRevenueDto> revenueByStore
) {}
