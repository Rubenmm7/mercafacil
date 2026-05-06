package com.mercafacil.dto;

import com.mercafacil.model.ChatType;

public record MarkReadRequest(
        ChatType chatType,
        Long orderId,
        Long shopId
) {}
