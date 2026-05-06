package com.mercafacil.repository;

import com.mercafacil.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    @Query("SELECT DISTINCT p FROM Product p LEFT JOIN p.storeOffers so " +
           "WHERE LOWER(p.name) LIKE %:q% OR LOWER(p.category) LIKE %:q% OR LOWER(so.brand) LIKE %:q%")
    List<Product> search(@Param("q") String query);
}
