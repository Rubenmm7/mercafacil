package com.mercafacil.repository;

import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.mercafacil.model.Order;
import com.mercafacil.model.User;

public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByClientOrderByIdDesc(User client);

    List<Order> findByDelivererOrderByIdDesc(User deliverer);

    @Query("SELECT DISTINCT o FROM Order o JOIN o.items i WHERE i.storeId IN :storeIds ORDER BY o.id DESC")
    List<Order> findByStoreIds(@Param("storeIds") List<Long> storeIds);

    List<Order> findByDelivererIsNullAndStatusOrderByIdDesc(com.mercafacil.model.OrderStatus status);

    List<Order> findByDelivererIsNullAndStatusInOrderByIdDesc(Collection<com.mercafacil.model.OrderStatus> statuses);

    long countByDelivererIsNullAndStatusIn(Collection<com.mercafacil.model.OrderStatus> statuses);
}
