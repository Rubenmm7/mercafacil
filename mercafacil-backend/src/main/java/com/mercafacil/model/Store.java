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

@Entity
@Table(name = "stores")
public class Store {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vendedor_id")
    private User vendedor;

    private String name;
    private String logo;
    private String color;

    @Column(name = "bg_color")
    private String bgColor;

    private String address;
    private String city;
    private String phone;
    private String hours;
    private Double rating;

    @Column(name = "delivery_time")
    private String deliveryTime;

    @Column(name = "min_order")
    private Integer minOrder;

    @Column(name = "delivery_fee")
    private Double deliveryFee;

    private String category;

    public Store() {
    }

    public Store(int id, String name, String logo, String color, String bgColor, String address, String city,
            String phone, String hours, double rating, String deliveryTime, int minOrder, double deliveryFee,
            String category) {
        this.id = (long) id;
        this.name = name;
        this.logo = logo;
        this.color = color;
        this.bgColor = bgColor;
        this.address = address;
        this.city = city;
        this.phone = phone;
        this.hours = hours;
        this.rating = rating;
        this.deliveryTime = deliveryTime;
        this.minOrder = minOrder;
        this.deliveryFee = deliveryFee;
        this.category = category;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getVendedor() {
        return vendedor;
    }

    public void setVendedor(User vendedor) {
        this.vendedor = vendedor;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getLogo() {
        return logo;
    }

    public void setLogo(String logo) {
        this.logo = logo;
    }

    public String getColor() {
        return color;
    }

    public void setColor(String color) {
        this.color = color;
    }

    public String getBgColor() {
        return bgColor;
    }

    public void setBgColor(String bgColor) {
        this.bgColor = bgColor;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getHours() {
        return hours;
    }

    public void setHours(String hours) {
        this.hours = hours;
    }

    public Double getRating() {
        return rating;
    }

    public void setRating(Double rating) {
        this.rating = rating;
    }

    public String getDeliveryTime() {
        return deliveryTime;
    }

    public void setDeliveryTime(String deliveryTime) {
        this.deliveryTime = deliveryTime;
    }

    public Integer getMinOrder() {
        return minOrder;
    }

    public void setMinOrder(Integer minOrder) {
        this.minOrder = minOrder;
    }

    public Double getDeliveryFee() {
        return deliveryFee;
    }

    public void setDeliveryFee(Double deliveryFee) {
        this.deliveryFee = deliveryFee;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }
}
