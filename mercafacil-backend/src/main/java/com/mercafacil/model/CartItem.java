package com.mercafacil.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

// Entidad que representa un item del carrito de compras persistido en BD
@Entity
@Table(name = "cart_items", uniqueConstraints = @UniqueConstraint(columnNames = { "user_id", "product_id",
        "store_id" }))
public class CartItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "product_id", nullable = false)
    private Long productId;

    @Column(name = "product_name", nullable = false, length = 200)
    private String productName;

    @Column(name = "product_image", length = 500)
    private String productImage;

    @Column(name = "store_id", nullable = false)
    private Long storeId;

    @Column(name = "store_name", nullable = false, length = 200)
    private String storeName;

    @Column(length = 100)
    private String brand;

    @Column(nullable = false)
    private Double price;

    @Column(nullable = false)
    private Integer quantity;

    @Column(length = 50)
    private String unit;

    // Getters & Setters

    public Long getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public Long getProductId() {
        return productId;
    }

    public void setProductId(Long v) {
        this.productId = v;
    }

    public String getProductName() {
        return productName;
    }

    public void setProductName(String v) {
        this.productName = v;
    }

    public String getProductImage() {
        return productImage;
    }

    public void setProductImage(String v) {
        this.productImage = v;
    }

    public Long getStoreId() {
        return storeId;
    }

    public void setStoreId(Long v) {
        this.storeId = v;
    }

    public String getStoreName() {
        return storeName;
    }

    public void setStoreName(String v) {
        this.storeName = v;
    }

    public String getBrand() {
        return brand;
    }

    public void setBrand(String v) {
        this.brand = v;
    }

    public Double getPrice() {
        return price;
    }

    public void setPrice(Double v) {
        this.price = v;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer v) {
        this.quantity = v;
    }

    public String getUnit() {
        return unit;
    }

    public void setUnit(String v) {
        this.unit = v;
    }
}
