package com.rutafantasma.backend.modelo;

import java.time.LocalDateTime;

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
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

/**
 * Cada vez que un usuario corre una ruta (tabla "carrera").
 * La carrera con menor tiempo total de una ruta es la "sombra" contra la que se compite.
 */
@Entity
@Table(name = "carrera")
public class Carrera {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ruta_id", nullable = false, foreignKey = @ForeignKey(name = "fk_carrera_ruta"))
    @OnDelete(action = OnDeleteAction.CASCADE) // ON DELETE CASCADE en MySQL
    private Ruta ruta;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false, foreignKey = @ForeignKey(name = "fk_carrera_usuario"))
    private Usuario usuario;

    @Column(nullable = false)
    private LocalDateTime fecha;

    @Column(name = "tiempo_total_segundos", nullable = false)
    private long tiempoTotalSegundos;

    /** true si esta carrera es la mejor marca (la sombra) de la ruta */
    @Column(name = "mejor_marca", nullable = false)
    private boolean mejorMarca;

    public Carrera() {
    }

    public Carrera(Ruta ruta, Usuario usuario, long tiempoTotalSegundos) {
        this.ruta = ruta;
        this.usuario = usuario;
        this.tiempoTotalSegundos = tiempoTotalSegundos;
    }

    @PrePersist
    void alCrear() {
        if (fecha == null) {
            fecha = LocalDateTime.now();
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Ruta getRuta() { return ruta; }
    public void setRuta(Ruta ruta) { this.ruta = ruta; }

    public Usuario getUsuario() { return usuario; }
    public void setUsuario(Usuario usuario) { this.usuario = usuario; }

    public LocalDateTime getFecha() { return fecha; }
    public void setFecha(LocalDateTime fecha) { this.fecha = fecha; }

    public long getTiempoTotalSegundos() { return tiempoTotalSegundos; }
    public void setTiempoTotalSegundos(long tiempoTotalSegundos) { this.tiempoTotalSegundos = tiempoTotalSegundos; }

    public boolean isMejorMarca() { return mejorMarca; }
    public void setMejorMarca(boolean mejorMarca) { this.mejorMarca = mejorMarca; }
}
