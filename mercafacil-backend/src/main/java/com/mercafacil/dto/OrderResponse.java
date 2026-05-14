package com.mercafacil.dto;

import java.util.List;

public record OrderResponse(
        Long id,
        String clientEmail,
        String status,
        Double total,
        List<OrderItemResponse> items,
        String createdAt,
        String shippingAddress,
        String deliveryNotes,
        String deliveredAt,
        Double deliveryLat,
        Double deliveryLng
) {}
