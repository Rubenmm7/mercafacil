package com.mercafacil.service;

import com.mercafacil.dto.*;
import com.mercafacil.model.*;
import com.mercafacil.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

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

    // --- Tiendas ---

    @Transactional(readOnly = true)
    public List<StoreDto> getMyStores(User vendedor) {
        return storeRepository.findByVendedor_Id(vendedor.getId())
                .stream().map(this::toStoreDto).toList();
    }

    private List<Long> myStoreIds(User vendedor) {
        return storeRepository.findByVendedor_Id(vendedor.getId())
                .stream().map(Store::getId).toList();
    }

    // --- Estadísticas ---

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

        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        double todayRevenue = orders.stream()
                .filter(o -> o.getCreatedAt() != null && o.getCreatedAt().isAfter(startOfDay))
                .mapToDouble(Order::getTotal)
                .sum();

        return new VendedorStatsDto(storeIds.size(), pending, lowStock, Math.round(todayRevenue * 100.0) / 100.0);
    }

    // --- Pedidos ---

    @Transactional(readOnly = true)
    public List<OrderResponse> getMyOrders(User vendedor) {
        var storeIds = myStoreIds(vendedor);
        if (storeIds.isEmpty()) return List.of();
        return orderRepository.findByStoreIds(storeIds).stream()
                .map(this::toOrderResponse).toList();
    }

    public OrderResponse updateOrderStatus(Long orderId, String newStatus, User vendedor) {
        var order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Pedido no encontrado: " + orderId));

        var storeIds = myStoreIds(vendedor);
        boolean ownsOrder = order.getItems().stream()
                .anyMatch(i -> storeIds.contains(i.getStoreId()));
        if (!ownsOrder) throw new SecurityException("No tienes permiso sobre este pedido");

        var status = OrderStatus.valueOf(newStatus);
        if (status == OrderStatus.ENTREGADO)
            throw new IllegalArgumentException("Solo el repartidor puede marcar como ENTREGADO");

        order.setStatus(status);
        return toOrderResponse(orderRepository.save(order));
    }

    // --- Productos ---

    @Transactional(readOnly = true)
    public List<ProductDto> getMyProducts(User vendedor) {
        var storeIds = myStoreIds(vendedor);
        if (storeIds.isEmpty()) return List.of();
        return storeOfferRepository.findByStoreIdIn(storeIds).stream()
                .map(StoreOffer::getProduct)
                .distinct()
                .map(p -> toProductDto(p, storeIds))
                .toList();
    }

    public ProductDto createProduct(ProductRequest req, Long storeId, User vendedor) {
        var storeIds = myStoreIds(vendedor);
        if (!storeIds.contains(storeId))
            throw new SecurityException("No tienes permiso sobre esta tienda");

        var store = storeRepository.findById(storeId)
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
        offer.setStoreId(storeId);
        offer.setStoreName(store.getName());
        offer.setPrice(0.0);
        offer.setStock(0);
        offer.setInStock(false);
        storeOfferRepository.save(offer);

        return toProductDto(product, storeIds);
    }

    public ProductDto updateProduct(Long productId, ProductRequest req, User vendedor) {
        var storeIds = myStoreIds(vendedor);
        var product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("Producto no encontrado: " + productId));

        boolean ownsProduct = product.getStoreOffers().stream()
                .anyMatch(o -> storeIds.contains(o.getStoreId()));
        if (!ownsProduct) throw new SecurityException("No tienes permiso sobre este producto");

        product.setName(req.name());
        product.setCategory(req.category());
        product.setImage(req.image());
        product.setDescription(req.description());
        product.setUnit(req.unit());
        return toProductDto(productRepository.save(product), storeIds);
    }

    public void deleteProduct(Long productId, User vendedor) {
        var storeIds = myStoreIds(vendedor);
        var product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("Producto no encontrado: " + productId));

        boolean ownsProduct = product.getStoreOffers().stream()
                .anyMatch(o -> storeIds.contains(o.getStoreId()));
        if (!ownsProduct) throw new SecurityException("No tienes permiso sobre este producto");

        productRepository.delete(product);
    }

    // --- Ofertas ---

    @Transactional(readOnly = true)
    public List<StoreOfferDto> getLowStockOffers(User vendedor) {
        var storeIds = myStoreIds(vendedor);
        if (storeIds.isEmpty()) return List.of();
        return storeOfferRepository.findByStoreIdInAndStockLessThan(storeIds, LOW_STOCK_THRESHOLD)
                .stream().map(this::toOfferDto).toList();
    }

    @Transactional(readOnly = true)
    public List<StoreOfferDto> getOffersByStore(Long storeId, User vendedor) {
        var storeIds = myStoreIds(vendedor);
        if (!storeIds.contains(storeId))
            throw new SecurityException("No tienes permiso sobre esta tienda");
        return storeOfferRepository.findByStoreId(storeId).stream().map(this::toOfferDto).toList();
    }

    public StoreOfferDto updateOffer(Long offerId, StoreOfferRequest req, User vendedor) {
        var storeIds = myStoreIds(vendedor);
        var offer = storeOfferRepository.findById(offerId)
                .orElseThrow(() -> new IllegalArgumentException("Oferta no encontrada: " + offerId));

        if (!storeIds.contains(offer.getStoreId()))
            throw new SecurityException("No tienes permiso sobre esta oferta");

        offer.setPrice(req.price());
        offer.setOriginalPrice(req.originalPrice());
        offer.setStock(req.stock());
        offer.setInStock(req.stock() > 0);
        if (req.brand() != null) offer.setBrand(req.brand());
        return toOfferDto(storeOfferRepository.save(offer));
    }

    // --- Mappers ---

    private StoreDto toStoreDto(Store s) {
        return new StoreDto(s.getId(), s.getName(), s.getLogo(), s.getColor(), s.getBgColor(),
                s.getAddress(), s.getCity(), s.getPhone(), s.getHours(), s.getRating(),
                s.getDeliveryTime(), s.getMinOrder(), s.getDeliveryFee(), s.getCategory());
    }

    private OrderResponse toOrderResponse(Order o) {
        var items = o.getItems().stream()
                .map(i -> new OrderItemResponse(i.getProductId(), i.getStoreId(), i.getQuantity(), i.getUnitPrice()))
                .toList();
        String clientEmail = o.getClient() != null ? o.getClient().getEmail() : null;
        String createdAt   = o.getCreatedAt() != null ? o.getCreatedAt().toString() : null;
        return new OrderResponse(o.getId(), clientEmail, o.getStatus().name(), o.getTotal(), items, createdAt);
    }

    private ProductDto toProductDto(Product p, List<Long> storeIds) {
        var offers = p.getStoreOffers() == null ? List.<StoreOfferDto>of() :
                p.getStoreOffers().stream()
                        .filter(o -> storeIds.contains(o.getStoreId()))
                        .map(this::toOfferDto)
                        .toList();
        return new ProductDto(p.getId(), p.getName(), p.getCategory(), p.getImage(),
                p.getDescription(), p.getUnit(), offers);
    }

    private StoreOfferDto toOfferDto(StoreOffer o) {
        String productName = o.getProduct() != null ? o.getProduct().getName() : null;
        String productUnit = o.getProduct() != null ? o.getProduct().getUnit() : null;
        Long productId     = o.getProduct() != null ? o.getProduct().getId()   : null;
        return new StoreOfferDto(o.getId(), productId, productName, productUnit,
                o.getStoreId(), o.getStoreName(), o.getPrice(), o.getOriginalPrice(),
                o.getStock(), o.isInStock(), o.getBrand());
    }
}
