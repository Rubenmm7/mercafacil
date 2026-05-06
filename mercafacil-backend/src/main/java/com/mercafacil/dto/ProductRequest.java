package com.mercafacil.dto;

public record ProductRequest(
    String name,
    String category,
    String image,
    String description,
    String unit
) {}
