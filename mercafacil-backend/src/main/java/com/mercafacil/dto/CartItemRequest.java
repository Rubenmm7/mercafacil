package com.mercafacil.dto;

// DTO de entrada para agregar/actualizar items del carrito
public record CartItemRequest(
    Long productId,
    String productName,
    String productImage,
    Long storeId,
    String storeName,
    String brand,
    Double price,
    Integer quantity,
    String unit
) {}
