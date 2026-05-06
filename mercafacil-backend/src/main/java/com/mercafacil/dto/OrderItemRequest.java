package com.mercafacil.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record OrderItemRequest(
        @NotNull Long productId,
        @NotNull Long storeId,
        @Min(1) int quantity,
        @NotNull Double unitPrice
) {}
