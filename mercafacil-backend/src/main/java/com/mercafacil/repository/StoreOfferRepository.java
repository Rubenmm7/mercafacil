package com.mercafacil.repository;

import com.mercafacil.model.StoreOffer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StoreOfferRepository extends JpaRepository<StoreOffer, Long> {
    List<StoreOffer> findByStoreId(Long storeId);
    List<StoreOffer> findByStoreIdIn(List<Long> storeIds);
    List<StoreOffer> findByStoreIdInAndStockLessThan(List<Long> storeIds, int threshold);
}
