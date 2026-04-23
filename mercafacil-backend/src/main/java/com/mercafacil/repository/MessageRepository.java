package com.mercafacil.repository;

import com.mercafacil.model.ChatType;
import com.mercafacil.model.Message;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {
    List<Message> findByOrder_IdAndChatTypeOrderByFechaAsc(Long orderId, ChatType chatType);
    List<Message> findByShop_IdAndChatTypeOrderByFechaAsc(Long shopId, ChatType chatType);
}
