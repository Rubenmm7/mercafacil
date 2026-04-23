package com.mercafacil.dto;

import com.mercafacil.model.ChatType;
import java.time.LocalDateTime;

public record MessageResponse(
    Long id,
    ChatType chatType,
    Long orderId,
    Long shopId,
    Long senderId,
    String senderName,
    String mensaje,
    LocalDateTime fecha
) {}
