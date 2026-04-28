package com.mercafacil.service;

import com.mercafacil.dto.*;
import com.mercafacil.model.Order;
import com.mercafacil.model.OrderItem;
import com.mercafacil.model.User;
import com.mercafacil.repository.OrderRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class OrderService {

    private final OrderRepository orderRepository;

    public OrderService(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
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
