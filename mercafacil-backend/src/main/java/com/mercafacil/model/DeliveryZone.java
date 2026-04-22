package com.mercafacil.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

@Entity
@Table(name = "delivery_zones")
public class DeliveryZone {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @JsonIgnore
    private Long id;

    private String zone;
    private Double fee;

    @Column(name = "min_time")
    private String minTime;

    @Column(name = "max_time")
    private String maxTime;

    private boolean available;

    @Column(name = "store_id")
    @JsonIgnore
    private Long storeId;

    public DeliveryZone() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getZone() { return zone; }
    public void setZone(String zone) { this.zone = zone; }
    public Double getFee() { return fee; }
    public void setFee(Double fee) { this.fee = fee; }
    public String getMinTime() { return minTime; }
    public void setMinTime(String minTime) { this.minTime = minTime; }
    public String getMaxTime() { return maxTime; }
    public void setMaxTime(String maxTime) { this.maxTime = maxTime; }
    public boolean isAvailable() { return available; }
    public void setAvailable(boolean available) { this.available = available; }
    public Long getStoreId() { return storeId; }
    public void setStoreId(Long storeId) { this.storeId = storeId; }
}
