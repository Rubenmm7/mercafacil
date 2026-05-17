package com.mercafacil.repository;

import java.time.LocalDateTime;
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

    List<Order> findByStatus(com.mercafacil.model.OrderStatus status);

    @Query("SELECT CAST(o.createdAt AS date), COUNT(o) FROM Order o JOIN o.items i " +
           "WHERE i.storeId IN :storeIds AND o.createdAt >= :since " +
           "GROUP BY CAST(o.createdAt AS date) ORDER BY CAST(o.createdAt AS date)")
    List<Object[]> countByDayForStores(@Param("storeIds") List<Long> storeIds,
                                       @Param("since") LocalDateTime since);

    @Query("SELECT CAST(o.createdAt AS date), COUNT(o) FROM Order o " +
           "WHERE o.createdAt >= :since " +
           "GROUP BY CAST(o.createdAt AS date) ORDER BY CAST(o.createdAt AS date)")
    List<Object[]> countByDayGlobal(@Param("since") LocalDateTime since);

    @Query("SELECT i.productName, SUM(i.quantity) FROM OrderItem i " +
           "WHERE i.storeId IN :storeIds AND i.order.createdAt >= :since AND i.productName IS NOT NULL " +
           "GROUP BY i.productName ORDER BY SUM(i.quantity) DESC")
    List<Object[]> topProductsForStores(@Param("storeIds") List<Long> storeIds,
                                        @Param("since") LocalDateTime since);

    @Query("SELECT i.productName, SUM(i.quantity) FROM OrderItem i " +
           "WHERE i.order.createdAt >= :since AND i.productName IS NOT NULL " +
           "GROUP BY i.productName ORDER BY SUM(i.quantity) DESC")
    List<Object[]> topProductsGlobal(@Param("since") LocalDateTime since);

    @Query("SELECT i.storeId, SUM(i.unitPrice * i.quantity) FROM OrderItem i " +
           "WHERE i.storeId IN :storeIds AND i.order.createdAt >= :since " +
           "GROUP BY i.storeId ORDER BY SUM(i.unitPrice * i.quantity) DESC")
    List<Object[]> revenueByStoreForStores(@Param("storeIds") List<Long> storeIds,
                                           @Param("since") LocalDateTime since);

    @Query("SELECT i.storeId, SUM(i.unitPrice * i.quantity) FROM OrderItem i " +
           "WHERE i.order.createdAt >= :since " +
           "GROUP BY i.storeId ORDER BY SUM(i.unitPrice * i.quantity) DESC")
    List<Object[]> revenueByStoreGlobal(@Param("since") LocalDateTime since);
}
