package com.mercafacil.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

public record TrackingRequest(
    @NotNull @DecimalMin("-90.0")  @DecimalMax("90.0")  Double latitud,
    @NotNull @DecimalMin("-180.0") @DecimalMax("180.0") Double longitud
) {}
