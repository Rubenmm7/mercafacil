package com.mercafacil.model;

import jakarta.persistence.*;

@Entity
@Table(name = "order_items")
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @Column(name = "product_id", nullable = false)
    private Long productId;

    @Column(name = "store_id", nullable = false)
    private Long storeId;

    @Column(nullable = false)
    private Integer quantity;

    @Column(name = "unit_price", nullable = false)
    private Double unitPrice;

    // Getters & Setters

    public Long    getId()                         { return id; }
    public Order   getOrder()                      { return order; }
    public void    setOrder(Order order)           { this.order = order; }
    public Long    getProductId()                  { return productId; }
    public void    setProductId(Long productId)    { this.productId = productId; }
    public Long    getStoreId()                    { return storeId; }
    public void    setStoreId(Long storeId)        { this.storeId = storeId; }
    public Integer getQuantity()                   { return quantity; }
    public void    setQuantity(Integer quantity)   { this.quantity = quantity; }
    public Double  getUnitPrice()                  { return unitPrice; }
    public void    setUnitPrice(Double unitPrice)  { this.unitPrice = unitPrice; }
}
