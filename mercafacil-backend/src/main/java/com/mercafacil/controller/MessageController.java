package com.mercafacil.controller;

import com.mercafacil.dto.ChatThreadDto;
import com.mercafacil.dto.MessageResponse;
import com.mercafacil.model.ChatType;
import com.mercafacil.model.User;
import com.mercafacil.service.MessageService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/messages")
public class MessageController {

    private final MessageService messageService;

    public MessageController(MessageService messageService) {
        this.messageService = messageService;
    }

    @GetMapping("/order/{orderId}")
    public ResponseEntity<List<MessageResponse>> getOrderMessages(
            @PathVariable Long orderId,
            @RequestParam ChatType type) {
        return ResponseEntity.ok(messageService.getByOrder(orderId, type));
    }

    @GetMapping("/shop/{shopId}")
    public ResponseEntity<List<MessageResponse>> getShopMessages(
            @PathVariable Long shopId,
            @RequestParam ChatType type) {
        return ResponseEntity.ok(messageService.getByShop(shopId, type));
    }

    @GetMapping("/threads")
    public ResponseEntity<List<ChatThreadDto>> getMyThreads(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(messageService.getMyThreads(user));
    }
}
