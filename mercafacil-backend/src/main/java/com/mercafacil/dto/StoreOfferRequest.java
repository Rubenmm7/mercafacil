package com.mercafacil.dto;

public record StoreOfferRequest(
    Long productId,
    Double price,
    Double originalPrice,
    Integer stock,
    String brand
) {}
