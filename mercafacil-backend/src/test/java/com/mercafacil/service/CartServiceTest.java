package com.mercafacil.service;

import com.mercafacil.dto.CartItemDto;
import com.mercafacil.dto.CartItemRequest;
import com.mercafacil.model.CartItem;
import com.mercafacil.model.User;
import com.mercafacil.repository.CartItemRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CartServiceTest {

    @Mock
    CartItemRepository cartItemRepository;

    CartService cartService;

    @BeforeEach
    void setUp() {
        cartService = new CartService(cartItemRepository);
    }

    // Si el producto no estaba en el carrito, se crea un CartItem nuevo y se guarda.
    @Test
    void addOrUpdate_itemNuevo_guardaCorrectamente() {
        User user = mock(User.class);
        when(user.getId()).thenReturn(1L);

        CartItemRequest req = new CartItemRequest(
                10L, "Leche", null, 2L, "Supermercado A", null, 1.5, 2, "L");

        when(cartItemRepository.findByUser_IdAndProductIdAndStoreId(1L, 10L, 2L))
                .thenReturn(Optional.empty());

        CartItem saved = new CartItem();
        saved.setProductId(10L);
        saved.setProductName("Leche");
        saved.setStoreId(2L);
        saved.setStoreName("Supermercado A");
        saved.setPrice(1.5);
        saved.setQuantity(2);

        when(cartItemRepository.save(any(CartItem.class))).thenReturn(saved);

        CartItemDto result = cartService.addOrUpdate(user, req);

        verify(cartItemRepository).save(any(CartItem.class));
        assertEquals(2, result.quantity());
        assertEquals("Leche", result.productName());
    }

    // Si el producto ya estaba en el carrito, la cantidad del request se suma a la existente.
    @Test
    void addOrUpdate_itemExistente_sumaLaCantidad() {
        User user = mock(User.class);
        when(user.getId()).thenReturn(1L);

        CartItemRequest req = new CartItemRequest(
                10L, "Leche", null, 2L, "Supermercado A", null, 1.5, 3, "L");

        CartItem existing = new CartItem();
        existing.setProductId(10L);
        existing.setProductName("Leche");
        existing.setStoreId(2L);
        existing.setStoreName("Supermercado A");
        existing.setPrice(1.5);
        existing.setQuantity(2); // ya había 2 unidades en el carrito

        when(cartItemRepository.findByUser_IdAndProductIdAndStoreId(1L, 10L, 2L))
                .thenReturn(Optional.of(existing));
        when(cartItemRepository.save(existing)).thenReturn(existing);

        CartItemDto result = cartService.addOrUpdate(user, req);

        assertEquals(5, result.quantity()); // 2 existentes + 3 nuevas
    }

    // Si se intenta actualizar la cantidad de un item que no existe, se lanza RuntimeException.
    @Test
    void updateQuantity_itemNoExiste_lanzaExcepcion() {
        User user = mock(User.class);
        when(user.getId()).thenReturn(1L);

        when(cartItemRepository.findByUser_IdAndProductIdAndStoreId(1L, 10L, 2L))
                .thenReturn(Optional.empty());

        assertThrows(RuntimeException.class,
                () -> cartService.updateQuantity(user, 10L, 2L, 5));
    }
}
