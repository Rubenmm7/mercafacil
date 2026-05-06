package com.mercafacil.dto;

import com.mercafacil.model.ChatType;

public record MessageRequest(
    ChatType chatType,
    Long orderId,
    Long shopId,
    Long replyToMessageId,
    String mensaje
) {}
