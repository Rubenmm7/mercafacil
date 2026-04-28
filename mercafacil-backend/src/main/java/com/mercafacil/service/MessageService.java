package com.mercafacil.service;

import com.mercafacil.dto.ChatThreadDto;
import com.mercafacil.dto.MessageRequest;
import com.mercafacil.dto.MessageResponse;
import com.mercafacil.model.ChatType;
import com.mercafacil.model.Message;
import com.mercafacil.model.Role;
import com.mercafacil.model.User;
import com.mercafacil.repository.MessageRepository;
import com.mercafacil.repository.OrderRepository;
import com.mercafacil.repository.StoreRepository;
import com.mercafacil.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
@Transactional
public class MessageService {

    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final StoreRepository storeRepository;

    public MessageService(MessageRepository messageRepository,
                          UserRepository userRepository,
                          OrderRepository orderRepository,
                          StoreRepository storeRepository) {
        this.messageRepository = messageRepository;
        this.userRepository = userRepository;
        this.orderRepository = orderRepository;
        this.storeRepository = storeRepository;
    }

    public MessageResponse save(MessageRequest req, String senderEmail) {
        var sender = userRepository.findByEmail(senderEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + senderEmail));

        var msg = new Message();
        msg.setChatType(req.chatType());
        msg.setMensaje(req.mensaje());
        msg.setSender(sender);

        if (req.orderId() != null) {
            Long orderId = Objects.requireNonNull(req.orderId());
            var order = orderRepository.findById(orderId)
                    .orElseThrow(() -> new IllegalArgumentException("Order not found: " + orderId));
            msg.setOrder(order);
        }
        if (req.shopId() != null) {
            Long shopId = Objects.requireNonNull(req.shopId());
            var shop = storeRepository.findById(shopId)
                    .orElseThrow(() -> new IllegalArgumentException("Shop not found: " + shopId));
            msg.setShop(shop);
        }

        return toResponse(messageRepository.save(msg));
    }

    @Transactional(readOnly = true)
    public List<MessageResponse> getByOrder(Long orderId, ChatType chatType) {
        return messageRepository.findByOrder_IdAndChatTypeOrderByFechaAsc(orderId, chatType)
                .stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<MessageResponse> getByShop(Long shopId, ChatType chatType) {
        return messageRepository.findByShop_IdAndChatTypeOrderByFechaAsc(shopId, chatType)
                .stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<ChatThreadDto> getMyThreads(User user) {
        List<Message> all = new ArrayList<>();

        if (user.getRol() == Role.CLIENTE) {
            all.addAll(messageRepository.findByOrder_Client_IdOrderByFechaDesc(user.getId()));
        }
        if (user.getRol() == Role.REPARTIDOR) {
            // Include messages from orders with an assigned deliverer...
            all.addAll(messageRepository.findByOrder_Deliverer_IdOrderByFechaDesc(user.getId()));
            // ...and also all chats of types involving a deliverer, so the
            // repartidor can see conversations even when order.deliverer is not set.
            all.addAll(messageRepository.findByChatTypeInOrderByFechaDesc(
                    List.of(ChatType.CLIENTE_REPARTIDOR, ChatType.VENDEDOR_REPARTIDOR)));
        }
        all.addAll(messageRepository.findBySender_IdOrderByFechaDesc(user.getId()));

        Map<String, Message> latestByThread = new LinkedHashMap<>();
        for (Message m : all) {
            String key = threadKey(m);
            Message existing = latestByThread.get(key);
            if (existing == null || m.getFecha().isAfter(existing.getFecha())) {
                latestByThread.put(key, m);
            }
        }

        return latestByThread.values().stream()
                .sorted(Comparator.comparing(Message::getFecha).reversed())
                .map(this::toThreadDto)
                .toList();
    }

    private String threadKey(Message m) {
        Long orderId = m.getOrder() != null ? m.getOrder().getId() : null;
        Long shopId  = m.getShop()  != null ? m.getShop().getId()  : null;
        return m.getChatType().name() + ":" + orderId + ":" + shopId;
    }

    private ChatThreadDto toThreadDto(Message m) {
        Long orderId = m.getOrder() != null ? m.getOrder().getId() : null;
        Long shopId  = m.getShop()  != null ? m.getShop().getId()  : null;
        String title = orderId != null ? "Pedido #" + orderId : "Tienda #" + shopId;
        String preview = m.getMensaje().length() > 80
                ? m.getMensaje().substring(0, 77) + "..."
                : m.getMensaje();
        return new ChatThreadDto(
                m.getChatType(),
                orderId,
                shopId,
                title,
                preview,
                m.getSender().getNombre() + " " + m.getSender().getApellidos(),
                m.getFecha()
        );
    }

    private MessageResponse toResponse(Message m) {
        return new MessageResponse(
                m.getId(),
                m.getChatType(),
                m.getOrder() != null ? m.getOrder().getId() : null,
                m.getShop()  != null ? m.getShop().getId()  : null,
                m.getSender().getId(),
                m.getSender().getNombre() + " " + m.getSender().getApellidos(),
                m.getMensaje(),
                m.getFecha()
        );
    }
}
