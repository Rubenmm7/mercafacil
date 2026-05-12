package com.mercafacil.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.mercafacil.dto.ChatThreadDto;
import com.mercafacil.dto.MarkReadRequest;
import com.mercafacil.dto.MessageResponse;
import com.mercafacil.model.ChatType;
import com.mercafacil.model.User;
import com.mercafacil.service.MessageService;

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

    @GetMapping("/unread-counts")
    public ResponseEntity<Map<String, Long>> getUnreadCounts(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(messageService.getUnreadCounts(user));
    }

    @PostMapping("/read")
    public ResponseEntity<Void> markRead(@RequestBody MarkReadRequest req,
            @AuthenticationPrincipal User user) {
        messageService.markRead(req, user.getId());
        return ResponseEntity.ok().build();
    }
}
