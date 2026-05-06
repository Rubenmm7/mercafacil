package com.mercafacil.controller;

import com.mercafacil.dto.MessageRequest;
import com.mercafacil.dto.MessageResponse;
import com.mercafacil.service.MessageService;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.Objects;

// @Controller sin @RestController: gestiona mensajes STOMP sobre WebSocket, no peticiones HTTP.
@Controller
public class ChatController {

    private final MessageService messageService;
    private final SimpMessagingTemplate messaging;

    public ChatController(MessageService messageService, SimpMessagingTemplate messaging) {
        this.messageService = messageService;
        this.messaging = messaging;
    }

    @MessageMapping("/chat/order/{orderId}")
    public void handleOrderChat(@DestinationVariable Long orderId,
                                MessageRequest req,
                                Principal principal) {
        MessageResponse response = messageService.save(req, principal.getName());
        String suffix = req.chatType().name().toLowerCase().replace('_', '-');
        messaging.convertAndSend("/topic/chat/order/" + orderId + "/" + suffix, Objects.requireNonNull(response));
    }

    @MessageMapping("/chat/shop/{shopId}")
    public void handleShopChat(@DestinationVariable Long shopId,
                               MessageRequest req,
                               Principal principal) {
        MessageResponse response = messageService.save(req, principal.getName());
        messaging.convertAndSend("/topic/chat/shop/" + shopId + "/proveedor-vendedor", Objects.requireNonNull(response));
    }
}
