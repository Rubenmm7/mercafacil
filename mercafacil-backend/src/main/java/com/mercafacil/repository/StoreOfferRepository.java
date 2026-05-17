package com.mercafacil.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.mercafacil.model.StoreOffer;

@Repository
public interface StoreOfferRepository extends JpaRepository<StoreOffer, Long> {
    List<StoreOffer> findByStoreId(Long storeId);

    Optional<StoreOffer> findByProduct_IdAndStoreId(Long productId, Long storeId);

    List<StoreOffer> findByStoreIdIn(List<Long> storeIds);

    List<StoreOffer> findByStoreIdInAndStockLessThan(List<Long> storeIds, int threshold);
}
