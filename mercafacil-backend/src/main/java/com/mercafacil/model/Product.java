package com.mercafacil.model;

import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;

@Entity
@Table(name = "products")
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String category;

    @Column(columnDefinition = "LONGTEXT")
    private String image;

    @Column(columnDefinition = "LONGTEXT")
    private String description;

    private String unit;

    @OneToMany(mappedBy = "product", fetch = FetchType.EAGER, cascade = CascadeType.ALL)
    private List<StoreOffer> storeOffers;

    public Product() {
    }

    public Product(int id, String name, String category, String image, String description, String unit,
            List<StoreOffer> storeOffers) {
        this.id = (long) id;
        this.name = name;
        this.category = category;
        this.image = image;
        this.description = description;
        this.unit = unit;
        this.storeOffers = storeOffers;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getImage() {
        return image;
    }

    public void setImage(String image) {
        this.image = image;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getUnit() {
        return unit;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }

    public List<StoreOffer> getStoreOffers() {
        return storeOffers;
    }

    public void setStoreOffers(List<StoreOffer> storeOffers) {
        this.storeOffers = storeOffers;
    }
}
