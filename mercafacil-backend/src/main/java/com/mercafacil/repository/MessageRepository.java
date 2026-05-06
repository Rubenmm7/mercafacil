package com.mercafacil.repository;

import com.mercafacil.model.ChatType;
import com.mercafacil.model.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {

    List<Message> findByOrder_IdAndChatTypeOrderByFechaAsc(Long orderId, ChatType chatType);
    List<Message> findByShop_IdAndChatTypeOrderByFechaAsc(Long shopId, ChatType chatType);

    List<Message> findByOrder_Client_IdOrderByFechaDesc(Long clientId);
    List<Message> findByOrder_Deliverer_IdOrderByFechaDesc(Long delivererId);
    List<Message> findBySender_IdOrderByFechaDesc(Long senderId);
    List<Message> findByChatTypeInOrderByFechaDesc(List<ChatType> chatTypes);

    long countByOrder_IdAndChatTypeAndIsReadFalseAndSender_IdNot(
            Long orderId, ChatType chatType, Long senderId);

    long countByShop_IdAndChatTypeAndIsReadFalseAndSender_IdNot(
            Long shopId, ChatType chatType, Long senderId);

    @Modifying
    @Query("UPDATE Message m SET m.isRead = true " +
           "WHERE m.order.id = :orderId AND m.chatType = :chatType " +
           "AND m.sender.id != :userId AND m.isRead = false")
    void markOrderThreadRead(@Param("orderId") Long orderId,
                             @Param("chatType") ChatType chatType,
                             @Param("userId") Long userId);

    @Modifying
    @Query("UPDATE Message m SET m.isRead = true " +
           "WHERE m.shop.id = :shopId AND m.chatType = :chatType " +
           "AND m.sender.id != :userId AND m.isRead = false")
    void markShopThreadRead(@Param("shopId") Long shopId,
                            @Param("chatType") ChatType chatType,
                            @Param("userId") Long userId);
}
