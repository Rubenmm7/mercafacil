package com.mercafacil.repository;

import com.mercafacil.model.Store;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StoreRepository extends JpaRepository<Store, Long> {
    List<Store> findByVendedor_Id(Long vendedorId);

    List<Store> findByVendedorIsNull();
}
