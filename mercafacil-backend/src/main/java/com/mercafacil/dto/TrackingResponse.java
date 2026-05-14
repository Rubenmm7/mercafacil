package com.mercafacil.dto;

public record TrackingResponse(
    Long id,
    Long orderId,
    Double latitud,
    Double longitud,
    String ultimaActualizacion
) {}
