package com.mercafacil.dto;

public record OrderItemResponse(
        Long productId,
        Long storeId,
        int quantity,
        Double unitPrice
) {}
