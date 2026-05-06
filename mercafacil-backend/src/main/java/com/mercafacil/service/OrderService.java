package com.mercafacil.service;

import com.mercafacil.dto.*;
import com.mercafacil.model.Order;
import com.mercafacil.model.Role;
import com.mercafacil.model.OrderItem;
import com.mercafacil.model.User;
import com.mercafacil.repository.OrderRepository;
import com.mercafacil.repository.StoreRepository;
import org.springframework.lang.NonNull;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final StoreRepository storeRepository;

    public OrderService(OrderRepository orderRepository, StoreRepository storeRepository) {
        this.orderRepository = orderRepository;
        this.storeRepository = storeRepository;
    }

    public OrderResponse create(OrderRequest req, User client) {
        Order order = new Order();
        order.setClient(client);

        double total = req.items().stream()
                .mapToDouble(i -> i.unitPrice() * i.quantity())
                .sum();
        order.setTotal(Math.round(total * 100.0) / 100.0);

        for (OrderItemRequest ir : req.items()) {
            OrderItem item = new OrderItem();
            item.setOrder(order);
            item.setProductId(ir.productId());
            item.setStoreId(ir.storeId());
            item.setQuantity(ir.quantity());
            item.setUnitPrice(ir.unitPrice());
            order.getItems().add(item);
        }

        return toResponse(orderRepository.save(order));
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> findByClient(User client) {
        return orderRepository.findByClientOrderByIdDesc(client)
                .stream().map(this::toResponse).toList();
    }

    public List<OrderResponse> findAll() {
        return orderRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public OrderResponse findByIdForUser(Long orderId, User user) {
        Long safeOrderId = requireId(orderId, "orderId");
        Order order = orderRepository.findById(safeOrderId)
                .orElseThrow(() -> new IllegalArgumentException("Pedido no encontrado: " + orderId));

        if (!canAccessOrder(order, user)) {
            throw new AccessDeniedException("No tienes permiso para ver este pedido");
        }
        return toResponse(order);
    }

    private boolean canAccessOrder(Order order, User user) {
        if (user.getRol() == Role.ADMIN) return true;

        Long userId = Objects.requireNonNull(user.getId(), "Usuario autenticado sin ID");
        if (user.getRol() == Role.CLIENTE) {
            return Objects.equals(order.getClient() != null ? order.getClient().getId() : null, userId);
        }
        if (user.getRol() == Role.REPARTIDOR) {
            return Objects.equals(order.getDeliverer() != null ? order.getDeliverer().getId() : null, userId);
        }
        if (user.getRol() == Role.VENDEDOR) {
            List<Long> myStoreIds = storeRepository.findByVendedor_Id(userId).stream().map(s -> s.getId()).toList();
            return order.getItems().stream().anyMatch(item -> myStoreIds.contains(item.getStoreId()));
        }
        return false;
    }

    private @NonNull Long requireId(Long id, String fieldName) {
        return Objects.requireNonNull(id, fieldName + " no puede ser null");
    }

    private OrderResponse toResponse(Order o) {
        List<OrderItemResponse> items = o.getItems().stream()
                .map(i -> new OrderItemResponse(
                        i.getProductId(), i.getStoreId(), i.getQuantity(), i.getUnitPrice()))
                .toList();
        String clientEmail = o.getClient() != null ? o.getClient().getEmail() : null;
        String createdAt = o.getCreatedAt() != null ? o.getCreatedAt().toString() : null;
        return new OrderResponse(o.getId(), clientEmail, o.getStatus().name(), o.getTotal(), items, createdAt);
    }
}
