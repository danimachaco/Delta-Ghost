package com.rutafantasma.backend.modelo;

import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

/**
 * Punto GPS de una ruta (tabla "punto").
 * El tiempo es el de la "sombra": los segundos que se tardó en llegar a este punto
 * en la carrera de referencia.
 */
@Entity
@Table(name = "punto", uniqueConstraints = @UniqueConstraint(name = "uk_punto_ruta_orden", columnNames = { "ruta_id", "orden" }))
public class Punto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ruta_id", nullable = false, foreignKey = @ForeignKey(name = "fk_punto_ruta"))
    @OnDelete(action = OnDeleteAction.CASCADE) // ON DELETE CASCADE en MySQL
    private Ruta ruta;

    /** Posición del punto dentro de la ruta: 0, 1, 2… */
    @Column(nullable = false)
    private int orden;

    /** Latitud en grados (-90 a 90) */
    @Column(nullable = false)
    private double latitud;

    /** Longitud en grados (-180 a 180) */
    @Column(nullable = false)
    private double longitud;

    /** Segundos transcurridos desde el inicio de la carrera */
    @Column(name = "tiempo_segundos", nullable = false)
    private long tiempoSegundos;

    public Punto() {
    }

    public Punto(double latitud, double longitud, long tiempoSegundos) {
        this.latitud = latitud;
        this.longitud = longitud;
        this.tiempoSegundos = tiempoSegundos;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Ruta getRuta() { return ruta; }
    public void setRuta(Ruta ruta) { this.ruta = ruta; }

    public int getOrden() { return orden; }
    public void setOrden(int orden) { this.orden = orden; }

    public double getLatitud() { return latitud; }
    public void setLatitud(double latitud) { this.latitud = latitud; }

    public double getLongitud() { return longitud; }
    public void setLongitud(double longitud) { this.longitud = longitud; }

    public long getTiempoSegundos() { return tiempoSegundos; }
    public void setTiempoSegundos(long tiempoSegundos) { this.tiempoSegundos = tiempoSegundos; }
}
