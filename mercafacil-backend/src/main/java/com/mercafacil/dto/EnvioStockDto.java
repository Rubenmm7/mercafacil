package com.mercafacil.dto;

import java.util.List;

public record EnvioStockDto(String id, Long storeId, String storeName, List<EnvioItemDto> items, String llegadaEstimada) {}
