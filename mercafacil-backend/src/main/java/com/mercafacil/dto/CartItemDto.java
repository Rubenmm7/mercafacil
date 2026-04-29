package com.mercafacil.dto;

// DTO de respuesta para items del carrito
public record CartItemDto(
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
