package com.rutafantasma.backend.modelo;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

/**
 * Recorrido guardado por un usuario (tabla "ruta").
 * Está formado por una lista ordenada de puntos GPS y se divide en sectores,
 * como un circuito de Fórmula 1. Cada vez que se corre se guarda una carrera.
 */
@Entity
@Table(name = "ruta")
public class Ruta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 60)
    private String nombre;

    /** Dueño de la ruta. LAZY: no se carga el usuario de la base de datos hasta que se necesita. */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false, foreignKey = @ForeignKey(name = "fk_ruta_usuario"))
    private Usuario usuario;

    @Column(name = "fecha_creacion", nullable = false, updatable = false)
    private LocalDateTime fechaCreacion;

    /** Al guardar o borrar la ruta se guardan o borran también sus puntos (cascade + orphanRemoval). */
    @OneToMany(mappedBy = "ruta", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("orden ASC")
    private List<Punto> puntos = new ArrayList<>();

    @OneToMany(mappedBy = "ruta", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("numero ASC")
    private List<Sector> sectores = new ArrayList<>();

    public Ruta() {
    }

    public Ruta(String nombre, Usuario usuario) {
        this.nombre = nombre;
        this.usuario = usuario;
    }

    @PrePersist
    void alCrear() {
        if (fechaCreacion == null) {
            fechaCreacion = LocalDateTime.now();
        }
    }

    /** Añade un punto al final de la ruta y mantiene las dos caras de la relación sincronizadas. */
    public void anadirPunto(Punto punto) {
        punto.setRuta(this);
        punto.setOrden(puntos.size());
        puntos.add(punto);
    }

    public void anadirSector(Sector sector) {
        sector.setRuta(this);
        sectores.add(sector);
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public Usuario getUsuario() { return usuario; }
    public void setUsuario(Usuario usuario) { this.usuario = usuario; }

    public LocalDateTime getFechaCreacion() { return fechaCreacion; }
    public void setFechaCreacion(LocalDateTime fechaCreacion) { this.fechaCreacion = fechaCreacion; }

    public List<Punto> getPuntos() { return puntos; }

    public List<Sector> getSectores() { return sectores; }
}
