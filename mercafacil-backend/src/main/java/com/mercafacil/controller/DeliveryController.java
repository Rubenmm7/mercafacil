package com.mercafacil.controller;

import com.mercafacil.model.DeliveryZone;
import com.mercafacil.service.DeliveryService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/delivery-zones")
public class DeliveryController {

    private final DeliveryService deliveryService;

    public DeliveryController(DeliveryService deliveryService) {
        this.deliveryService = deliveryService;
    }

    @GetMapping
    public List<DeliveryZone> getAll() {
        return deliveryService.findAll();
    }
}
