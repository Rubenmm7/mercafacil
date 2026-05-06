package com.mercafacil.dto;

public record StoreOfferDto(
    Long id,
    Long productId,
    String productName,
    String productUnit,
    Long storeId,
    String storeName,
    Double price,
    Double originalPrice,
    Integer stock,
    boolean inStock,
    String brand
) {}
