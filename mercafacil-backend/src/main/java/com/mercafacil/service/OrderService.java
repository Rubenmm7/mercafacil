package com.mercafacil.service;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

import com.mercafacil.model.Product;

import org.springframework.lang.NonNull;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mercafacil.dto.OrderItemRequest;
import com.mercafacil.dto.OrderItemResponse;
import com.mercafacil.dto.OrderRequest;
import com.mercafacil.dto.OrderResponse;
import com.mercafacil.model.Order;
import com.mercafacil.model.OrderItem;
import com.mercafacil.model.OrderStatus;
import com.mercafacil.model.Role;
import com.mercafacil.model.User;
import com.mercafacil.repository.OrderRepository;
import com.mercafacil.repository.ProductRepository;
import com.mercafacil.repository.StoreRepository;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final StoreRepository storeRepository;
    private final ProductRepository productRepository;

    public OrderService(OrderRepository orderRepository, StoreRepository storeRepository,
            ProductRepository productRepository) {
        this.orderRepository = orderRepository;
        this.storeRepository = storeRepository;
        this.productRepository = productRepository;
    }

    public OrderResponse create(OrderRequest req, User client) {
        Order order = new Order();
        order.setClient(client);

        double total = req.items().stream()
                .mapToDouble(i -> i.unitPrice() * i.quantity())
                .sum();
        order.setTotal(Math.round(total * 100.0) / 100.0);
        order.setShippingAddress(req.shippingAddress());
        order.setDeliveryNotes(req.deliveryNotes());
        order.setDeliveryLat(req.deliveryLat());
        order.setDeliveryLng(req.deliveryLng());

        for (OrderItemRequest ir : req.items()) {
            OrderItem item = new OrderItem();
            item.setOrder(order);
            Long productId = ir.productId();
            item.setProductId(productId);
            item.setStoreId(ir.storeId());
            item.setQuantity(ir.quantity());
            item.setUnitPrice(ir.unitPrice());
            if (productId != null) {
                productRepository.findById(productId).ifPresent(p -> {
                    item.setProductName(p.getName());
                    item.setProductImage(p.getImage());
                });
            }
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

    @Transactional
    public void cancelOrder(Long orderId, User client) {
        Long safeId = requireId(orderId, "orderId");
        Order order = orderRepository.findById(safeId)
                .orElseThrow(() -> new IllegalArgumentException("Pedido no encontrado: " + orderId));

        Long clientId = Objects.requireNonNull(client.getId(), "Cliente sin ID");
        if (!Objects.equals(order.getClient() != null ? order.getClient().getId() : null, clientId)) {
            throw new AccessDeniedException("No tienes permiso para cancelar este pedido");
        }
        if (order.getStatus() != OrderStatus.PENDIENTE) {
            throw new IllegalStateException("Solo se pueden cancelar pedidos en estado PENDIENTE");
        }
        order.setStatus(OrderStatus.CANCELADO);
        orderRepository.save(order);
    }

    private boolean canAccessOrder(Order order, User user) {
        if (user.getRol() == Role.ADMIN)
            return true;

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
        List<Long> missingIds = o.getItems().stream()
                .filter(i -> i.getProductName() == null)
                .map(OrderItem::getProductId)
                .distinct().collect(Collectors.toList());

        Map<Long, Product> productMap = missingIds.isEmpty()
                ? Map.of()
                : productRepository.findAllById(missingIds).stream()
                        .collect(Collectors.toMap(Product::getId, p -> p));

        List<OrderItemResponse> items = o.getItems().stream()
                .map(i -> {
                    String name = i.getProductName();
                    String image = i.getProductImage();
                    if (name == null) {
                        Product p = productMap.get(i.getProductId());
                        if (p != null) {
                            name = p.getName();
                            image = p.getImage();
                        }
                    }
                    return new OrderItemResponse(
                            i.getProductId(), i.getStoreId(),
                            i.getQuantity() != null ? i.getQuantity() : 0,
                            i.getUnitPrice(), name, image);
                })
                .toList();

        String clientEmail = o.getClient() != null ? o.getClient().getEmail() : null;
        String createdAt = o.getCreatedAt() != null ? o.getCreatedAt().toString() : null;
        String deliveredAt = o.getDeliveredAt() != null ? o.getDeliveredAt().toString() : null;
        return new OrderResponse(o.getId(), clientEmail, o.getStatus().name(), o.getTotal(), items, createdAt,
                o.getShippingAddress(), o.getDeliveryNotes(), deliveredAt, o.getDeliveryLat(), o.getDeliveryLng());
    }
}
