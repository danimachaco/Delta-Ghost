package com.rutafantasma.backend.modelo;

import java.time.LocalDateTime;

import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

/**
 * Relación de amistad entre dos corredores (tabla "amistad").
 * Empieza como solicitud PENDIENTE que envía el "solicitante" y pasa a ACEPTADA cuando
 * el "destinatario" la acepta. Solo hay una fila por pareja de usuarios en cada sentido.
 */
@Entity
@Table(name = "amistad", uniqueConstraints = @UniqueConstraint(name = "uk_amistad_pareja", columnNames = { "solicitante_id", "destinatario_id" }))
public class Amistad {

    /** Estados de una amistad: solicitud enviada o amistad confirmada */
    public enum Estado { PENDIENTE, ACEPTADA }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Quien envía la solicitud */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "solicitante_id", nullable = false, foreignKey = @ForeignKey(name = "fk_amistad_solicitante"))
    @OnDelete(action = OnDeleteAction.CASCADE) // ON DELETE CASCADE en MySQL
    private Usuario solicitante;

    /** Quien recibe la solicitud y puede aceptarla */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "destinatario_id", nullable = false, foreignKey = @ForeignKey(name = "fk_amistad_destinatario"))
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Usuario destinatario;

    /** Se guarda como texto ("PENDIENTE" / "ACEPTADA") para que se entienda al mirar la tabla */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private Estado estado = Estado.PENDIENTE;

    @Column(name = "fecha_solicitud", nullable = false, updatable = false)
    private LocalDateTime fechaSolicitud;

    /** Cuándo se aceptó (null mientras está pendiente) */
    @Column(name = "fecha_aceptada")
    private LocalDateTime fechaAceptada;

    public Amistad() {
    }

    public Amistad(Usuario solicitante, Usuario destinatario) {
        this.solicitante = solicitante;
        this.destinatario = destinatario;
    }

    @PrePersist
    void alCrear() {
        if (fechaSolicitud == null) {
            fechaSolicitud = LocalDateTime.now();
        }
    }

    /** Pasa la solicitud a amistad confirmada */
    public void aceptar() {
        estado = Estado.ACEPTADA;
        fechaAceptada = LocalDateTime.now();
    }

    /** El otro usuario de la amistad, visto desde `usuarioId` */
    public Usuario otro(Long usuarioId) {
        return solicitante.getId().equals(usuarioId) ? destinatario : solicitante;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Usuario getSolicitante() { return solicitante; }
    public void setSolicitante(Usuario solicitante) { this.solicitante = solicitante; }

    public Usuario getDestinatario() { return destinatario; }
    public void setDestinatario(Usuario destinatario) { this.destinatario = destinatario; }

    public Estado getEstado() { return estado; }
    public void setEstado(Estado estado) { this.estado = estado; }

    public LocalDateTime getFechaSolicitud() { return fechaSolicitud; }
    public void setFechaSolicitud(LocalDateTime fechaSolicitud) { this.fechaSolicitud = fechaSolicitud; }

    public LocalDateTime getFechaAceptada() { return fechaAceptada; }
    public void setFechaAceptada(LocalDateTime fechaAceptada) { this.fechaAceptada = fechaAceptada; }
}
