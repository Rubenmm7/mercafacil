package com.mercafacil.dto;

public record StoreDto(
    Long id,
    String name,
    String logo,
    String color,
    String bgColor,
    String address,
    String city,
    String phone,
    String hours,
    Double rating,
    String deliveryTime,
    Integer minOrder,
    Double deliveryFee,
    String category
) {}
