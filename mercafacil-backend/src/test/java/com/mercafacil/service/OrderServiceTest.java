package com.mercafacil.service;

import com.mercafacil.model.*;
import com.mercafacil.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    OrderRepository orderRepository;
    @Mock
    MessageRepository messageRepository;
    @Mock
    StoreRepository storeRepository;
    @Mock
    ProductRepository productRepository;
    @Mock
    StoreOfferRepository storeOfferRepository;

    OrderService orderService;

    @BeforeEach
    void setUp() {
        orderService = new OrderService(
                orderRepository, messageRepository,
                storeRepository, productRepository, storeOfferRepository);
    }

    // Un pedido PENDIENTE se cancela correctamente: el estado pasa a CANCELADO.
    @Test
    void cancelOrder_pendiente_cancelaCorrectamente() {
        User client = mock(User.class);
        when(client.getId()).thenReturn(1L);

        Order order = mock(Order.class);
        when(order.getClient()).thenReturn(client);
        when(order.getStatus()).thenReturn(OrderStatus.PENDIENTE);
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));

        orderService.cancelOrder(1L, client);

        verify(order).setStatus(OrderStatus.CANCELADO);
        verify(orderRepository).save(order);
    }

    // Un pedido en PREPARACION restaura el stock del producto al cancelarse.
    @Test
    void cancelOrder_preparacion_restauraStock() {
        User client = mock(User.class);
        when(client.getId()).thenReturn(1L);

        OrderItem item = new OrderItem();
        item.setProductId(10L);
        item.setStoreId(2L);
        item.setQuantity(3);

        StoreOffer offer = new StoreOffer();
        offer.setStock(5);

        Order order = mock(Order.class);
        when(order.getClient()).thenReturn(client);
        when(order.getStatus()).thenReturn(OrderStatus.PREPARACION);
        when(order.getItems()).thenReturn(List.of(item));
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));
        when(storeOfferRepository.findByProduct_IdAndStoreId(10L, 2L))
                .thenReturn(Optional.of(offer));

        orderService.cancelOrder(1L, client);

        assertEquals(8, offer.getStock()); // 5 existentes + 3 devueltos
        verify(storeOfferRepository).save(offer);
    }

    // Un pedido EN_RUTA no se puede cancelar: se lanza IllegalStateException.
    @Test
    void cancelOrder_estadoInvalido_lanzaExcepcion() {
        User client = mock(User.class);
        when(client.getId()).thenReturn(1L);

        Order order = mock(Order.class);
        when(order.getClient()).thenReturn(client);
        when(order.getStatus()).thenReturn(OrderStatus.EN_RUTA);
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));

        assertThrows(IllegalStateException.class,
                () -> orderService.cancelOrder(1L, client));
    }

    // Un cliente distinto al dueño del pedido no puede cancelarlo: AccessDeniedException.
    @Test
    void cancelOrder_otroCliente_lanzaExcepcion() {
        User owner = mock(User.class);
        when(owner.getId()).thenReturn(1L);

        User otherClient = mock(User.class);
        when(otherClient.getId()).thenReturn(99L);

        Order order = mock(Order.class);
        when(order.getClient()).thenReturn(owner);
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));

        assertThrows(AccessDeniedException.class,
                () -> orderService.cancelOrder(1L, otherClient));
    }
}
