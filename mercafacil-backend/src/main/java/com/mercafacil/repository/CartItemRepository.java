package com.mercafacil.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.mercafacil.model.CartItem;

public interface CartItemRepository extends JpaRepository<CartItem, Long> {

    List<CartItem> findByUser_Id(Long userId);

    Optional<CartItem> findByUser_IdAndProductIdAndStoreId(Long userId, Long productId, Long storeId);

    void deleteByUser_Id(Long userId);

    void deleteByUser_IdAndProductIdAndStoreId(Long userId, Long productId, Long storeId);
}
