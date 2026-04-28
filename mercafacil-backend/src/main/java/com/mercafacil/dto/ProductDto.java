package com.mercafacil.dto;

import java.util.List;

public record ProductDto(
    Long id,
    String name,
    String category,
    String image,
    String description,
    String unit,
    List<StoreOfferDto> offers
) {}
