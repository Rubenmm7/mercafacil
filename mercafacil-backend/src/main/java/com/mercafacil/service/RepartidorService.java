package com.mercafacil.service;

import com.mercafacil.dto.OrderItemResponse;
import com.mercafacil.dto.OrderResponse;
import com.mercafacil.dto.RepartidorStatsDto;
import com.mercafacil.model.Order;
import com.mercafacil.model.OrderStatus;
import com.mercafacil.model.User;
import com.mercafacil.repository.OrderRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.Set;

@Service
@Transactional
public class RepartidorService {

    private static final Set<OrderStatus> REPARTIDOR_TRANSITIONS =
            Set.of(OrderStatus.EN_RUTA, OrderStatus.ENTREGADO);

    private final OrderRepository orderRepository;

    public RepartidorService(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    // --- Estadísticas ---

    @Transactional(readOnly = true)
    public RepartidorStatsDto getStats(User repartidor) {
        Objects.requireNonNull(repartidor.getId(), "El repartidor autenticado no tiene ID");
        var orders = orderRepository.findByDelivererOrderByIdDesc(repartidor);
        long pendingPool = orderRepository.countByDelivererIsNullAndStatusIn(
                Set.of(OrderStatus.PENDIENTE, OrderStatus.PREPARACION));

        long enRuta = orders.stream()
                .filter(o -> o.getStatus() == OrderStatus.EN_RUTA)
                .count();

        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        long deliveredToday = orders.stream()
                .filter(o -> o.getStatus() == OrderStatus.ENTREGADO
                          && o.getCreatedAt() != null
                          && o.getCreatedAt().isAfter(startOfDay))
                .count();

        return new RepartidorStatsDto(orders.size(), pendingPool, enRuta, deliveredToday);
    }

    // --- Mis pedidos asignados ---

    @Transactional(readOnly = true)
    public List<OrderResponse> getMyOrders(User repartidor) {
        Objects.requireNonNull(repartidor.getId(), "El repartidor autenticado no tiene ID");
        return orderRepository.findByDelivererOrderByIdDesc(repartidor)
                .stream().map(this::toOrderResponse).toList();
    }

    // --- Pedidos disponibles (PREPARACION sin repartidor) ---

    @Transactional(readOnly = true)
    public List<OrderResponse> getAvailableOrders() {
        return orderRepository.findByDelivererIsNullAndStatusOrderByIdDesc(OrderStatus.PREPARACION)
                .stream().map(this::toOrderResponse).toList();
    }

    // --- Aceptar una entrega ---

    public OrderResponse acceptOrder(Long orderId, User repartidor) {
        var order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Pedido no encontrado: " + orderId));

        if (order.getDeliverer() != null)
            throw new IllegalStateException("Este pedido ya tiene repartidor asignado");
        if (order.getStatus() != OrderStatus.PREPARACION)
            throw new IllegalStateException("Solo se pueden aceptar pedidos en PREPARACION");

        order.setDeliverer(repartidor);
        return toOrderResponse(orderRepository.save(order));
    }

    // --- Avanzar estado ---

    public OrderResponse updateOrderStatus(Long orderId, String newStatus, User repartidor) {
        var order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Pedido no encontrado: " + orderId));

        Long repartidorId = Objects.requireNonNull(repartidor.getId(), "El repartidor autenticado no tiene ID");
        if (!Objects.equals(order.getDeliverer() != null ? order.getDeliverer().getId() : null, repartidorId))
            throw new SecurityException("No tienes permiso sobre este pedido");

        var status = OrderStatus.valueOf(newStatus);
        if (!REPARTIDOR_TRANSITIONS.contains(status))
            throw new IllegalArgumentException("Transición no permitida para repartidor: " + newStatus);

        order.setStatus(status);
        return toOrderResponse(orderRepository.save(order));
    }

    // --- Mapper ---

    private OrderResponse toOrderResponse(Order o) {
        var items = o.getItems().stream()
                .map(i -> new OrderItemResponse(i.getProductId(), i.getStoreId(), i.getQuantity(), i.getUnitPrice()))
                .toList();
        String clientEmail = o.getClient() != null ? o.getClient().getEmail() : null;
        String createdAt   = o.getCreatedAt() != null ? o.getCreatedAt().toString() : null;
        return new OrderResponse(o.getId(), clientEmail, o.getStatus().name(), o.getTotal(), items, createdAt);
    }
}
