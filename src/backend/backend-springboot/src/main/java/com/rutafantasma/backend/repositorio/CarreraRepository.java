package com.rutafantasma.backend.repositorio;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.rutafantasma.backend.modelo.Carrera;

/** Acceso a la tabla "carrera". La carrera más rápida de una ruta es la "sombra". */
public interface CarreraRepository extends JpaRepository<Carrera, Long> {

    /** La sombra: la carrera con menor tiempo total de la ruta */
    Optional<Carrera> findFirstByRutaIdOrderByTiempoTotalSegundosAsc(Long rutaId);

    /**
     * La mejor marca de un corredor en la ruta (PS-64: cada corredor tiene la suya).
     * Puede no haber ninguna: el dueño todavía no ha batido su grabación o el corredor aún no ha corrido la ruta.
     */
    Optional<Carrera> findFirstByRutaIdAndUsuarioIdAndMejorMarcaTrue(Long rutaId, Long usuarioId);

    /** La última carrera de un corredor en la ruta (sombra ULTIMA, PS-70); el id desempata dos con la misma fecha */
    Optional<Carrera> findFirstByRutaIdAndUsuarioIdOrderByFechaDescIdDesc(Long rutaId, Long usuarioId);

    /** Historial de carreras de una ruta, de la más reciente a la más antigua */
    List<Carrera> findByRutaIdOrderByFechaDesc(Long rutaId);
}
