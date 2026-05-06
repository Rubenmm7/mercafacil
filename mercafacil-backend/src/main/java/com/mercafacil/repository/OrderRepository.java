package com.mercafacil.repository;

import com.mercafacil.model.Order;
import com.mercafacil.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByClientOrderByIdDesc(User client);
    List<Order> findByDelivererOrderByIdDesc(User deliverer);

    @Query("SELECT DISTINCT o FROM Order o JOIN o.items i WHERE i.storeId IN :storeIds ORDER BY o.id DESC")
    List<Order> findByStoreIds(@Param("storeIds") List<Long> storeIds);

    List<Order> findByDelivererIsNullAndStatusOrderByIdDesc(com.mercafacil.model.OrderStatus status);
    long countByDelivererIsNullAndStatusIn(Collection<com.mercafacil.model.OrderStatus> statuses);
}
