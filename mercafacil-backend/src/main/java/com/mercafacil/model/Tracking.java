package com.mercafacil.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "tracking")
public class Tracking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Pedido al que pertenece esta posición GPS
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @Column(nullable = false)
    private Double latitud;

    @Column(nullable = false)
    private Double longitud;

    @Column(name = "ultima_actualizacion", nullable = false)
    private LocalDateTime ultimaActualizacion;

    // Rellena el timestamp tanto en INSERT como en UPDATE
    @PrePersist
    @PreUpdate
    protected void touchTimestamp() {
        ultimaActualizacion = LocalDateTime.now();
    }

    public Long getId()                                         { return id; }
    public Order getOrder()                                     { return order; }
    public void setOrder(Order order)                           { this.order = order; }
    public Double getLatitud()                                  { return latitud; }
    public void setLatitud(Double latitud)                      { this.latitud = latitud; }
    public Double getLongitud()                                 { return longitud; }
    public void setLongitud(Double longitud)                    { this.longitud = longitud; }
    public LocalDateTime getUltimaActualizacion()               { return ultimaActualizacion; }
}
