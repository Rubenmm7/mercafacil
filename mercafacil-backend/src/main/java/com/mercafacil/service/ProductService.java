package com.mercafacil.service;

import com.mercafacil.model.Product;
import com.mercafacil.repository.ProductRepository;
import org.springframework.stereotype.Service;

import java.util.List;

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
