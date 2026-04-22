package com.mercafacil.service;

import com.mercafacil.model.DeliveryZone;
import com.mercafacil.repository.DeliveryZoneRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DeliveryService {

    private final DeliveryZoneRepository deliveryZoneRepository;

    public DeliveryService(DeliveryZoneRepository deliveryZoneRepository) {
        this.deliveryZoneRepository = deliveryZoneRepository;
    }

    public List<DeliveryZone> findAll() {
        return deliveryZoneRepository.findAll();
    }
}
