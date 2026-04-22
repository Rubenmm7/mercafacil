package com.mercafacil.repository;

import com.mercafacil.model.Order;
import com.mercafacil.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByClientOrderByIdDesc(User client);
}
