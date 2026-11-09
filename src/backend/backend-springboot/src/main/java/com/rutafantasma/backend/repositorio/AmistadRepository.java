package com.rutafantasma.backend.repositorio;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.rutafantasma.backend.modelo.Amistad;

/** Acceso a la tabla "amistad" (solicitudes pendientes y amistades aceptadas). */
public interface AmistadRepository extends JpaRepository<Amistad, Long> {

    /** La relación entre dos usuarios en un sentido concreto (de solicitante a destinatario) */
    Optional<Amistad> findBySolicitanteIdAndDestinatarioId(Long solicitanteId, Long destinatarioId);

    /** Solicitudes que ha recibido un usuario, de la más nueva a la más antigua */
    List<Amistad> findByDestinatarioIdAndEstadoOrderByFechaSolicitudDesc(Long destinatarioId, Amistad.Estado estado);

    /** Solicitudes que ha enviado un usuario, de la más nueva a la más antigua */
    List<Amistad> findBySolicitanteIdAndEstadoOrderByFechaSolicitudDesc(Long solicitanteId, Amistad.Estado estado);

    /** Amistades aceptadas de un usuario, la haya pedido él o el otro, de la más reciente a la más antigua */
    @Query("""
            select a from Amistad a
            where a.estado = com.rutafantasma.backend.modelo.Amistad.Estado.ACEPTADA
              and (a.solicitante.id = :usuarioId or a.destinatario.id = :usuarioId)
            order by a.fechaAceptada desc
            """)
    List<Amistad> amigosDe(@Param("usuarioId") Long usuarioId);
}
