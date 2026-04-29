package com.mercafacil.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mercafacil.dto.ProveedorStatsDto;
import com.mercafacil.dto.StoreDto;
import com.mercafacil.model.ChatType;
import com.mercafacil.model.Message;
import com.mercafacil.model.Store;
import com.mercafacil.model.User;
import com.mercafacil.repository.MessageRepository;
import com.mercafacil.repository.StoreRepository;

@Service
@Transactional(readOnly = true)
public class ProveedorService {

    private final StoreRepository storeRepository;
    private final MessageRepository messageRepository;

    public ProveedorService(StoreRepository storeRepository,
                            MessageRepository messageRepository) {
        this.storeRepository = storeRepository;
        this.messageRepository = messageRepository;
    }

    public List<StoreDto> getAllStores() {
        return storeRepository.findAll().stream()
                .map(this::toStoreDto)
                .toList();
    }

    /**
     * KPIs for the proveedor dashboard.
     */
    public ProveedorStatsDto getStats(User proveedor) {
        List<Store> allStores = storeRepository.findAll();
        int totalStores = allStores.size();

        // Count distinct shop threads where the proveedor has participated
        List<Message> proveedorMessages = messageRepository
                .findBySender_IdOrderByFechaDesc(proveedor.getId());
        long activeChats = proveedorMessages.stream()
                .filter(m -> m.getChatType() == ChatType.PROVEEDOR_VENDEDOR && m.getShop() != null)
                .map(m -> m.getShop().getId())
                .distinct()
                .count();

        // Total products available across all stores
        long totalProducts = allStores.stream()
                .mapToLong(Store::getId)
                .count();

        return new ProveedorStatsDto(totalStores, activeChats, totalProducts);
    }

    private StoreDto toStoreDto(Store s) {
        return new StoreDto(s.getId(), s.getName(), s.getLogo(), s.getColor(), s.getBgColor(),
                s.getAddress(), s.getCity(), s.getPhone(), s.getHours(), s.getRating(),
                s.getDeliveryTime(), s.getMinOrder(), s.getDeliveryFee(), s.getCategory());
    }
}
