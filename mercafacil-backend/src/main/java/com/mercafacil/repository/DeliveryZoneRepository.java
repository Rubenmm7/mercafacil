package com.mercafacil.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.mercafacil.model.DeliveryZone;

@Repository
public interface DeliveryZoneRepository extends JpaRepository<DeliveryZone, Long> {
}
