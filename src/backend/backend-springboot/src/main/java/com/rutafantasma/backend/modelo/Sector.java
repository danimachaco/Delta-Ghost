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
 * Tramo de una ruta (tabla "sector"), como los sectores de un circuito de F1.
 * Al pasar por el final de cada sector el reloj avisa en verde (vas más rápido que tu sombra)
 * o en rojo (más lento). El sector va del punto con orden "puntoInicio" al punto "puntoFin".
 */
@Entity
@Table(name = "sector", uniqueConstraints = @UniqueConstraint(name = "uk_sector_ruta_numero", columnNames = { "ruta_id", "numero" }))
public class Sector {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ruta_id", nullable = false, foreignKey = @ForeignKey(name = "fk_sector_ruta"))
    @OnDelete(action = OnDeleteAction.CASCADE) // ON DELETE CASCADE en MySQL
    private Ruta ruta;

    /** Número del sector dentro de la ruta: 1, 2, 3… */
    @Column(nullable = false)
    private int numero;

    /** Orden del punto donde empieza el sector */
    @Column(name = "punto_inicio", nullable = false)
    private int puntoInicio;

    /** Orden del punto donde termina el sector */
    @Column(name = "punto_fin", nullable = false)
    private int puntoFin;

    public Sector() {
    }

    public Sector(int numero, int puntoInicio, int puntoFin) {
        this.numero = numero;
        this.puntoInicio = puntoInicio;
        this.puntoFin = puntoFin;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Ruta getRuta() { return ruta; }
    public void setRuta(Ruta ruta) { this.ruta = ruta; }

    public int getNumero() { return numero; }
    public void setNumero(int numero) { this.numero = numero; }

    public int getPuntoInicio() { return puntoInicio; }
    public void setPuntoInicio(int puntoInicio) { this.puntoInicio = puntoInicio; }

    public int getPuntoFin() { return puntoFin; }
    public void setPuntoFin(int puntoFin) { this.puntoFin = puntoFin; }
}
