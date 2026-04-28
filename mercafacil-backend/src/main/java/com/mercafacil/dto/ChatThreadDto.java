package com.mercafacil.dto;

import com.mercafacil.model.ChatType;
import java.time.LocalDateTime;

public record ChatThreadDto(
    ChatType chatType,
    Long orderId,
    Long shopId,
    String title,
    String lastMessage,
    String lastSenderName,
    LocalDateTime lastMessageDate
) {}
