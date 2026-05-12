package com.mercafacil.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.mercafacil.model.Product;
import com.mercafacil.repository.ProductRepository;

@Service
public class ProductService {

    private final ProductRepository productRepository;

    public ProductService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    public List<Product> findAll(String query) {
        if (query != null && !query.isBlank()) {
            return productRepository.search(query.toLowerCase());
        }
        return productRepository.findAll();
    }
}
