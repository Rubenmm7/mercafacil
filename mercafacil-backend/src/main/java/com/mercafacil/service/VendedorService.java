package com.mercafacil.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;

import org.springframework.lang.NonNull;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mercafacil.dto.OrderItemResponse;
import com.mercafacil.dto.OrderResponse;
import com.mercafacil.dto.ProductDto;
import com.mercafacil.dto.ProductRequest;
import com.mercafacil.dto.StoreDto;
import com.mercafacil.dto.StoreOfferDto;
import com.mercafacil.dto.StoreOfferRequest;
import com.mercafacil.dto.VendedorStatsDto;
import com.mercafacil.model.Order;
import com.mercafacil.model.OrderStatus;
import com.mercafacil.model.Product;
import com.mercafacil.model.Store;
import com.mercafacil.model.StoreOffer;
import com.mercafacil.model.User;
import com.mercafacil.repository.OrderRepository;
import com.mercafacil.repository.ProductRepository;
import com.mercafacil.repository.StoreOfferRepository;
import com.mercafacil.repository.StoreRepository;
import com.mercafacil.util.DateTimeUtils;

@Service
@Transactional
public class VendedorService {

    private static final int LOW_STOCK_THRESHOLD = 10;

    private final StoreRepository storeRepository;
    private final StoreOfferRepository storeOfferRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;

    public VendedorService(StoreRepository storeRepository,
            StoreOfferRepository storeOfferRepository,
            ProductRepository productRepository,
            OrderRepository orderRepository) {
        this.storeRepository = storeRepository;
        this.storeOfferRepository = storeOfferRepository;
        this.productRepository = productRepository;
        this.orderRepository = orderRepository;
    }

    @Transactional(readOnly = true)
    public List<StoreDto> getMyStores(User vendedor) {
        Long vendedorId = requireVendedorId(vendedor);
        return storeRepository.findByVendedor_Id(vendedorId)
                .stream().map(this::toStoreDto).toList();
    }

    private List<Long> myStoreIds(User vendedor) {
        Long vendedorId = requireVendedorId(vendedor);
        return storeRepository.findByVendedor_Id(vendedorId)
                .stream().map(Store::getId).toList();
    }

    @Transactional(readOnly = true)
    public VendedorStatsDto getStats(User vendedor) {
        var storeIds = myStoreIds(vendedor);
        if (storeIds.isEmpty()) {
            return new VendedorStatsDto(0, 0, 0, 0.0);
        }

        var orders = orderRepository.findByStoreIds(storeIds);
        long pending = orders.stream()
                .filter(o -> o.getStatus() == OrderStatus.PENDIENTE || o.getStatus() == OrderStatus.PREPARACION)
                .count();

        long lowStock = storeOfferRepository
                .findByStoreIdInAndStockLessThan(storeIds, LOW_STOCK_THRESHOLD).size();

        LocalDateTime startOfDay = DateTimeUtils.startOfTodayMadrid();
        double todayRevenue = orders.stream()
                .filter(o -> o.getCreatedAt() != null && o.getCreatedAt().isAfter(startOfDay))
                .mapToDouble(Order::getTotal)
                .sum();

        return new VendedorStatsDto(storeIds.size(), pending, lowStock, Math.round(todayRevenue * 100.0) / 100.0);
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getMyOrders(User vendedor) {
        var storeIds = myStoreIds(vendedor);
        if (storeIds.isEmpty())
            return List.of();
        return orderRepository.findByStoreIds(storeIds).stream()
                .map(this::toOrderResponse).toList();
    }

    public OrderResponse updateOrderStatus(Long orderId, String newStatus, User vendedor) {
        Long safeOrderId = requireId(orderId, "orderId");
        var order = orderRepository.findById(safeOrderId)
                .orElseThrow(() -> new IllegalArgumentException("Pedido no encontrado: " + orderId));

        var storeIds = myStoreIds(vendedor);
        boolean ownsOrder = order.getItems().stream()
                .anyMatch(i -> storeIds.contains(i.getStoreId()));
        if (!ownsOrder)
            throw new AccessDeniedException("No tienes permiso sobre este pedido");

        var status = OrderStatus.valueOf(newStatus);
        if (status != OrderStatus.PREPARACION)
            throw new IllegalArgumentException("El vendedor solo puede avanzar pedidos a PREPARACION");
        if (order.getStatus() != OrderStatus.PENDIENTE)
            throw new IllegalStateException("Solo se pueden preparar pedidos en estado PENDIENTE");

        order.setStatus(status);
        return toOrderResponse(orderRepository.save(order));
    }

    @Transactional(readOnly = true)
    public List<ProductDto> getMyProducts(User vendedor) {
        var storeIds = myStoreIds(vendedor);
        if (storeIds.isEmpty())
            return List.of();
        return storeOfferRepository.findByStoreIdIn(storeIds).stream()
                .map(StoreOffer::getProduct)
                .distinct()
                .map(p -> toProductDto(p, storeIds))
                .toList();
    }

    public ProductDto createProduct(ProductRequest req, Long storeId, User vendedor) {
        var storeIds = myStoreIds(vendedor);
        Long safeStoreId = requireId(storeId, "storeId");
        if (!storeIds.contains(safeStoreId))
            throw new AccessDeniedException("No tienes permiso sobre esta tienda");

        var store = storeRepository.findById(safeStoreId)
                .orElseThrow(() -> new IllegalArgumentException("Tienda no encontrada: " + storeId));

        var product = new Product();
        product.setName(req.name());
        product.setCategory(req.category());
        product.setImage(req.image());
        product.setDescription(req.description());
        product.setUnit(req.unit());
        product = productRepository.save(product);

        var offer = new StoreOffer();
        offer.setProduct(product);
        offer.setStoreId(safeStoreId);
        offer.setStoreName(store.getName());
        offer.setPrice(0.0);
        offer.setStock(0);
        offer.setInStock(false);
        storeOfferRepository.save(offer);

        return toProductDto(product, storeIds);
    }

    public ProductDto updateProduct(Long productId, ProductRequest req, User vendedor) {
        var storeIds = myStoreIds(vendedor);
        Long safeProductId = requireId(productId, "productId");
        var product = productRepository.findById(safeProductId)
                .orElseThrow(() -> new IllegalArgumentException("Producto no encontrado: " + productId));

        boolean ownsProduct = product.getStoreOffers().stream()
                .anyMatch(o -> storeIds.contains(o.getStoreId()));
        if (!ownsProduct)
            throw new AccessDeniedException("No tienes permiso sobre este producto");

        product.setName(req.name());
        product.setCategory(req.category());
        product.setImage(req.image());
        product.setDescription(req.description());
        product.setUnit(req.unit());
        return toProductDto(productRepository.save(product), storeIds);
    }

    public void deleteProduct(Long productId, User vendedor) {
        var storeIds = myStoreIds(vendedor);
        Long safeProductId = requireId(productId, "productId");
        var product = productRepository.findById(safeProductId)
                .orElseThrow(() -> new IllegalArgumentException("Producto no encontrado: " + productId));

        boolean ownsProduct = product.getStoreOffers().stream()
                .anyMatch(o -> storeIds.contains(o.getStoreId()));
        if (!ownsProduct)
            throw new AccessDeniedException("No tienes permiso sobre este producto");

        productRepository.delete(product);
    }

    @Transactional(readOnly = true)
    public List<StoreOfferDto> getLowStockOffers(User vendedor) {
        var storeIds = myStoreIds(vendedor);
        if (storeIds.isEmpty())
            return List.of();
        return storeOfferRepository.findByStoreIdInAndStockLessThan(storeIds, LOW_STOCK_THRESHOLD)
                .stream().map(this::toOfferDto).toList();
    }

    @Transactional(readOnly = true)
    public List<StoreOfferDto> getOffersByStore(Long storeId, User vendedor) {
        var storeIds = myStoreIds(vendedor);
        if (!storeIds.contains(storeId))
            throw new AccessDeniedException("No tienes permiso sobre esta tienda");
        return storeOfferRepository.findByStoreId(storeId).stream().map(this::toOfferDto).toList();
    }

    public StoreOfferDto updateOffer(Long offerId, StoreOfferRequest req, User vendedor) {
        var storeIds = myStoreIds(vendedor);
        Long safeOfferId = requireId(offerId, "offerId");
        var offer = storeOfferRepository.findById(safeOfferId)
                .orElseThrow(() -> new IllegalArgumentException("Oferta no encontrada: " + offerId));

        if (!storeIds.contains(offer.getStoreId()))
            throw new AccessDeniedException("No tienes permiso sobre esta oferta");

        offer.setPrice(req.price());
        offer.setOriginalPrice(req.originalPrice());
        offer.setStock(req.stock());
        offer.setInStock(req.stock() > 0);
        if (req.brand() != null)
            offer.setBrand(req.brand());
        return toOfferDto(storeOfferRepository.save(offer));
    }

    private StoreDto toStoreDto(Store s) {
        return new StoreDto(s.getId(), s.getName(), s.getLogo(), s.getColor(), s.getBgColor(),
                s.getAddress(), s.getCity(), s.getPhone(), s.getHours(), s.getRating(),
                s.getDeliveryTime(), s.getMinOrder(), s.getDeliveryFee(), s.getCategory());
    }

    private OrderResponse toOrderResponse(Order o) {
        var items = o.getItems().stream()
                .map(i -> new OrderItemResponse(i.getProductId(), i.getStoreId(),
                        i.getQuantity(),
                        i.getUnitPrice(), i.getProductName(), i.getProductImage()))
                .toList();
        String clientEmail = o.getClient() != null ? o.getClient().getEmail() : null;
        String createdAt = DateTimeUtils.toApiString(o.getCreatedAt());
        String deliveredAt = DateTimeUtils.toApiString(o.getDeliveredAt());
        return new OrderResponse(o.getId(), clientEmail, o.getStatus().name(), o.getTotal(), items, createdAt,
                o.getShippingAddress(), o.getDeliveryNotes(), deliveredAt, o.getDeliveryLat(), o.getDeliveryLng());
    }

    private ProductDto toProductDto(Product p, List<Long> storeIds) {
        var offers = p.getStoreOffers() == null ? List.<StoreOfferDto>of()
                : p.getStoreOffers().stream()
                        .filter(o -> storeIds.contains(o.getStoreId()))
                        .map(this::toOfferDto)
                        .toList();
        return new ProductDto(p.getId(), p.getName(), p.getCategory(), p.getImage(),
                p.getDescription(), p.getUnit(), offers);
    }

    private StoreOfferDto toOfferDto(StoreOffer o) {
        String productName = o.getProduct() != null ? o.getProduct().getName() : null;
        String productUnit = o.getProduct() != null ? o.getProduct().getUnit() : null;
        Long productId = o.getProduct() != null ? o.getProduct().getId() : null;
        return new StoreOfferDto(o.getId(), productId, productName, productUnit,
                o.getStoreId(), o.getStoreName(), o.getPrice(), o.getOriginalPrice(),
                o.getStock(), o.isInStock(), o.getBrand());
    }

    private @NonNull Long requireId(Long id, String fieldName) {
        return Objects.requireNonNull(id, fieldName + " no puede ser null");
    }

    private @NonNull Long requireVendedorId(User vendedor) {
        return Objects.requireNonNull(vendedor.getId(), "El vendedor autenticado no tiene ID");
    }
}
