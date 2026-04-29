package com.mercafacil.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mercafacil.dto.CartItemDto;
import com.mercafacil.dto.CartItemRequest;
import com.mercafacil.model.CartItem;
import com.mercafacil.model.User;
import com.mercafacil.repository.CartItemRepository;

@Service
@Transactional
public class CartService {

    private final CartItemRepository cartItemRepository;

    public CartService(CartItemRepository cartItemRepository) {
        this.cartItemRepository = cartItemRepository;
    }

    @Transactional(readOnly = true)
    public List<CartItemDto> getCart(User user) {
        return cartItemRepository.findByUser_Id(user.getId())
                .stream().map(this::toDto).toList();
    }

    // Agrega un item al carrito; si ya existe, suma la cantidad
    public CartItemDto addOrUpdate(User user, CartItemRequest req) {
        CartItem item = cartItemRepository
                .findByUser_IdAndProductIdAndStoreId(user.getId(), req.productId(), req.storeId())
                .orElse(null);

        if (item == null) {
            item = new CartItem();
            item.setUser(user);
            item.setProductId(req.productId());
            item.setProductName(req.productName());
            item.setProductImage(req.productImage());
            item.setStoreId(req.storeId());
            item.setStoreName(req.storeName());
            item.setBrand(req.brand());
            item.setPrice(req.price());
            item.setQuantity(req.quantity());
            item.setUnit(req.unit());
        } else {
            item.setQuantity(item.getQuantity() + req.quantity());
        }
        return toDto(cartItemRepository.save(item));
    }

    // Actualiza solo la cantidad de un item existente
    public CartItemDto updateQuantity(User user, Long productId, Long storeId, int quantity) {
        CartItem item = cartItemRepository
                .findByUser_IdAndProductIdAndStoreId(user.getId(), productId, storeId)
                .orElseThrow(() -> new RuntimeException("Item no encontrado en el carrito"));
        item.setQuantity(quantity);
        return toDto(cartItemRepository.save(item));
    }

    // Elimina un item concreto del carrito
    public void removeItem(User user, Long productId, Long storeId) {
        cartItemRepository.deleteByUser_IdAndProductIdAndStoreId(user.getId(), productId, storeId);
    }

    // Vacía el carrito completo del usuario
    public void clearCart(User user) {
        cartItemRepository.deleteByUser_Id(user.getId());
    }

    // Fusiona carrito invitado (localStorage) con el carrito guardado en BD al hacer login
    public List<CartItemDto> mergeCart(User user, List<CartItemRequest> items) {
        for (CartItemRequest req : items) {
            CartItem existing = cartItemRepository
                    .findByUser_IdAndProductIdAndStoreId(user.getId(), req.productId(), req.storeId())
                    .orElse(null);
            if (existing == null) {
                CartItem item = new CartItem();
                item.setUser(user);
                item.setProductId(req.productId());
                item.setProductName(req.productName());
                item.setProductImage(req.productImage());
                item.setStoreId(req.storeId());
                item.setStoreName(req.storeName());
                item.setBrand(req.brand());
                item.setPrice(req.price());
                item.setQuantity(req.quantity());
                item.setUnit(req.unit());
                cartItemRepository.save(item);
            } else {
                // Conserva la cantidad mayor entre local y servidor
                existing.setQuantity(Math.max(existing.getQuantity(), req.quantity()));
                cartItemRepository.save(existing);
            }
        }
        return getCart(user);
    }

    private CartItemDto toDto(CartItem c) {
        return new CartItemDto(
                c.getProductId(), c.getProductName(), c.getProductImage(),
                c.getStoreId(), c.getStoreName(), c.getBrand(),
                c.getPrice(), c.getQuantity(), c.getUnit());
    }
}
