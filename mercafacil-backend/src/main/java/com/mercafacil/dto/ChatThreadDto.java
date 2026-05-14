package com.mercafacil.dto;

import com.mercafacil.model.ChatType;

public record ChatThreadDto(
    ChatType chatType,
    Long orderId,
    Long shopId,
    String title,
    String lastMessage,
    String lastSenderName,
    String lastMessageDate
) {}
