package com.mercafacil.dto;

import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public record OrderRequest(@NotEmpty List<OrderItemRequest> items) {}
