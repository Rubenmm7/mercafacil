package com.mercafacil.service;

import com.mercafacil.dto.OrderItemResponse;
import com.mercafacil.dto.OrderResponse;
import com.mercafacil.dto.RepartidorStatsDto;
import com.mercafacil.model.Order;
import com.mercafacil.model.OrderStatus;
import com.mercafacil.model.User;
import com.mercafacil.repository.OrderRepository;
import org.springframework.lang.NonNull;
import org.springframework.security.access.AccessDeniedException;
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

    // Solo el repartidor puede poner un pedido EN_RUTA o ENTREGADO; ningún otro rol puede.
    private static final Set<OrderStatus> REPARTIDOR_TRANSITIONS =
            Set.of(OrderStatus.EN_RUTA, OrderStatus.ENTREGADO);

    private final OrderRepository orderRepository;

    public RepartidorService(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    @Transactional(readOnly = true)
    public RepartidorStatsDto getStats(User repartidor) {
        requireUserId(repartidor);
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

    @Transactional(readOnly = true)
    public List<OrderResponse> getMyOrders(User repartidor) {
        requireUserId(repartidor);
        return orderRepository.findByDelivererOrderByIdDesc(repartidor)
                .stream().map(this::toOrderResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getAvailableOrders() {
        return orderRepository.findByDelivererIsNullAndStatusOrderByIdDesc(OrderStatus.PREPARACION)
                .stream().map(this::toOrderResponse).toList();
    }

    public OrderResponse acceptOrder(Long orderId, User repartidor) {
        Long safeOrderId = requireId(orderId, "orderId");
        var order = orderRepository.findById(safeOrderId)
                .orElseThrow(() -> new IllegalArgumentException("Pedido no encontrado: " + orderId));

        if (order.getDeliverer() != null)
            throw new IllegalStateException("Este pedido ya tiene repartidor asignado");
        if (order.getStatus() != OrderStatus.PREPARACION)
            throw new IllegalStateException("Solo se pueden aceptar pedidos en PREPARACION");

        order.setDeliverer(repartidor);
        return toOrderResponse(orderRepository.save(order));
    }

    public OrderResponse updateOrderStatus(Long orderId, String newStatus, User repartidor) {
        Long safeOrderId = requireId(orderId, "orderId");
        var order = orderRepository.findById(safeOrderId)
                .orElseThrow(() -> new IllegalArgumentException("Pedido no encontrado: " + orderId));

        Long repartidorId = requireUserId(repartidor);
        if (!Objects.equals(order.getDeliverer() != null ? order.getDeliverer().getId() : null, repartidorId))
            throw new AccessDeniedException("No tienes permiso sobre este pedido");

        var status = OrderStatus.valueOf(newStatus);
        if (!REPARTIDOR_TRANSITIONS.contains(status))
            throw new IllegalArgumentException("Transición no permitida para repartidor: " + newStatus);

        order.setStatus(status);
        return toOrderResponse(orderRepository.save(order));
    }

    private @NonNull Long requireId(Long id, String fieldName) {
        return Objects.requireNonNull(id, fieldName + " no puede ser null");
    }

    private @NonNull Long requireUserId(User user) {
        return Objects.requireNonNull(user.getId(), "El repartidor autenticado no tiene ID");
    }

    private OrderResponse toOrderResponse(Order o) {
        var items = o.getItems().stream()
                .map(i -> new OrderItemResponse(i.getProductId(), i.getStoreId(), i.getQuantity(), i.getUnitPrice()))
                .toList();
        String clientEmail = o.getClient() != null ? o.getClient().getEmail() : null;
        String createdAt   = o.getCreatedAt() != null ? o.getCreatedAt().toString() : null;
        return new OrderResponse(o.getId(), clientEmail, o.getStatus().name(), o.getTotal(), items, createdAt,
                o.getShippingAddress(), o.getDeliveryNotes());
    }
}
