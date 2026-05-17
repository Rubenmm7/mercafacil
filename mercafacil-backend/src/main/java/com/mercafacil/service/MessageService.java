package com.mercafacil.service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mercafacil.dto.ChatThreadDto;
import com.mercafacil.dto.MarkReadRequest;
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
import com.mercafacil.util.DateTimeUtils;

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

        Long orderId = req.orderId();
        if (orderId != null) {
            var order = orderRepository.findById(orderId)
                    .orElseThrow(() -> new IllegalArgumentException("Order not found: " + orderId));
            msg.setOrder(order);
        }
        Long shopId = req.shopId();
        if (shopId != null) {
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
            all.addAll(messageRepository.findByOrder_Client_IdOrderByFechaDesc(user.getId()).stream()
                    .filter(m -> m.getChatType() == ChatType.CLIENTE_REPARTIDOR)
                    .toList());
        }
        if (user.getRol() == Role.REPARTIDOR) {
            all.addAll(messageRepository.findByOrder_Deliverer_IdOrderByFechaDesc(user.getId()));
            all.addAll(messageRepository.findByChatTypeInOrderByFechaDesc(
                    List.of(ChatType.CLIENTE_REPARTIDOR, ChatType.VENDEDOR_REPARTIDOR)));
        }
        all.addAll(messageRepository.findBySender_IdOrderByFechaDesc(user.getId()));

        // Deduplicar: para cada hilo (chatType + orden/tienda) quedarse con el mensaje más reciente
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

    @Transactional
    public void markRead(MarkReadRequest req, Long userId) {
        if (req.orderId() != null) {
            messageRepository.markOrderThreadRead(req.orderId(), req.chatType(), userId);
        } else if (req.shopId() != null) {
            messageRepository.markShopThreadRead(req.shopId(), req.chatType(), userId);
        }
    }

    @Transactional(readOnly = true)
    public Map<String, Long> getUnreadCounts(User user) {
        List<ChatThreadDto> threads = getMyThreads(user);
        Map<String, Long> result = new LinkedHashMap<>();
        for (ChatThreadDto t : threads) {
            long count;
            if (t.orderId() != null) {
                count = messageRepository.countByOrder_IdAndChatTypeAndIsReadFalseAndSender_IdNot(
                        t.orderId(), t.chatType(), user.getId());
                if (count > 0)
                    result.put("order-" + t.orderId() + "-" + t.chatType().name(), count);
            } else if (t.shopId() != null) {
                count = messageRepository.countByShop_IdAndChatTypeAndIsReadFalseAndSender_IdNot(
                        t.shopId(), t.chatType(), user.getId());
                if (count > 0)
                    result.put("shop-" + t.shopId() + "-" + t.chatType().name(), count);
            }
        }
        return result;
    }

    private String threadKey(Message m) {
        Long orderId = m.getOrder() != null ? m.getOrder().getId() : null;
        Long shopId = m.getShop() != null ? m.getShop().getId() : null;
        return m.getChatType().name() + ":" + orderId + ":" + shopId;
    }

    private ChatThreadDto toThreadDto(Message m) {
        Long orderId = m.getOrder() != null ? m.getOrder().getId() : null;
        Long shopId = m.getShop() != null ? m.getShop().getId() : null;
        String title;
        if (orderId != null) {
            title = "Pedido #" + orderId;
        } else if (m.getShop() != null) {
            title = m.getShop().getName();
        } else {
            title = "Tienda #" + shopId;
        }
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
                DateTimeUtils.toApiString(m.getFecha()));
    }

    private MessageResponse toResponse(Message m) {
        return new MessageResponse(
                m.getId(),
                m.getChatType(),
                m.getOrder() != null ? m.getOrder().getId() : null,
                m.getShop() != null ? m.getShop().getId() : null,
                m.getSender().getId(),
                m.getSender().getNombre() + " " + m.getSender().getApellidos(),
                m.getMensaje(),
                DateTimeUtils.toApiString(m.getFecha()));
    }
}
