package com.mercafacil.model;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "orders")
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cliente_id", nullable = false)
    private User client;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "repartidor_id")
    private User deliverer;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado", nullable = false, length = 20)
    private OrderStatus status = OrderStatus.PENDIENTE;

    @Column(nullable = false)
    private Double total;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<OrderItem> items = new ArrayList<>();

    // Getters & Setters

    public Long        getId()                           { return id; }
    public User        getClient()                       { return client; }
    public void        setClient(User client)            { this.client = client; }
    public User        getDeliverer()                    { return deliverer; }
    public void        setDeliverer(User deliverer)      { this.deliverer = deliverer; }
    public OrderStatus getStatus()                       { return status; }
    public void        setStatus(OrderStatus status)     { this.status = status; }
    public Double      getTotal()                        { return total; }
    public void        setTotal(Double total)            { this.total = total; }
    public List<OrderItem> getItems()                    { return items; }
    public void        setItems(List<OrderItem> items)   { this.items = items; }
}
