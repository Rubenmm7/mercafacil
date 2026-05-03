package com.mercafacil.dto;

import java.time.LocalDateTime;

public record TrackingResponse(
    Long id,
    Long orderId,
    Double latitud,
    Double longitud,
    LocalDateTime ultimaActualizacion
) {}
