package com.mercafacil.service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.scheduling.TaskScheduler;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mercafacil.dto.EnvioItemDto;
import com.mercafacil.dto.EnvioStockDto;
import com.mercafacil.dto.ReponerRequest;
import com.mercafacil.repository.StoreOfferRepository;
import com.mercafacil.repository.StoreRepository;
import com.mercafacil.util.DateTimeUtils;

@Service
public class StockReposicionService {

    private static final long DELAY_SEGUNDOS = 600; // 10 minutos

    private final Map<String, EnvioStockDto> enviosPendientes = new ConcurrentHashMap<>();

    private final StoreOfferRepository storeOfferRepository;
    private final StoreRepository storeRepository;
    private final TaskScheduler taskScheduler;

    public StockReposicionService(StoreOfferRepository storeOfferRepository,
            StoreRepository storeRepository,
            TaskScheduler taskScheduler) {
        this.storeOfferRepository = storeOfferRepository;
        this.storeRepository = storeRepository;
        this.taskScheduler = taskScheduler;
    }

    @Transactional
    public EnvioStockDto reponer(ReponerRequest req) {
        Long storeId = Objects.requireNonNull(req.storeId(), "storeId no puede ser null");

        String storeName = storeRepository.findById(storeId)
                .map(s -> s.getName())
                .orElseThrow(() -> new IllegalArgumentException("Tienda no encontrada: " + storeId));

        List<EnvioItemDto> items = new ArrayList<>();
        for (var item : req.items()) {
            if (item.cantidad() <= 0) continue;
            storeOfferRepository.findById(item.offerId()).ifPresent(offer -> {
                String productName = offer.getProduct() != null ? offer.getProduct().getName() : "Producto " + item.offerId();
                items.add(new EnvioItemDto(productName, item.cantidad()));
            });
        }

        if (items.isEmpty()) {
            throw new IllegalStateException("No hay ítems válidos en el envío");
        }

        String id = UUID.randomUUID().toString();
        String llegadaEstimada = DateTimeUtils.toApiString(DateTimeUtils.nowMadrid().plusSeconds(DELAY_SEGUNDOS));
        EnvioStockDto envio = new EnvioStockDto(id, storeId, storeName, items, llegadaEstimada);
        enviosPendientes.put(id, envio);

        // Programar el incremento de stock tras 10 minutos
        taskScheduler.schedule(() -> aplicarStock(id, req), Instant.now().plusSeconds(DELAY_SEGUNDOS));

        return envio;
    }

    public List<EnvioStockDto> getEnviosEnCurso() {
        return new ArrayList<>(enviosPendientes.values());
    }

    private void aplicarStock(String envioId, ReponerRequest req) {
        for (var item : req.items()) {
            if (item.cantidad() <= 0) continue;
            storeOfferRepository.findById(item.offerId()).ifPresent(offer -> {
                offer.setStock(offer.getStock() + item.cantidad());
                offer.setInStock(true);
                storeOfferRepository.save(offer);
            });
        }
        enviosPendientes.remove(envioId);
    }
}
