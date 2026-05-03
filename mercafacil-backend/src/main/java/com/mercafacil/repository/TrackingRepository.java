package com.mercafacil.repository;

import com.mercafacil.model.Tracking;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TrackingRepository extends JpaRepository<Tracking, Long> {

    // Historial completo de posiciones de un pedido, ordenado cronológicamente
    List<Tracking> findByOrder_IdOrderByUltimaActualizacionAsc(Long orderId);

    // Última posición registrada para un pedido
    Optional<Tracking> findTopByOrder_IdOrderByUltimaActualizacionDesc(Long orderId);
}
