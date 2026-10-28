package com.rutafantasma.backend.repositorio;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.rutafantasma.backend.modelo.Carrera;

/** Acceso a la tabla "carrera". La carrera más rápida de una ruta es la "sombra". */
public interface CarreraRepository extends JpaRepository<Carrera, Long> {

    /** La sombra: la carrera con menor tiempo total de la ruta */
    Optional<Carrera> findFirstByRutaIdOrderByTiempoTotalSegundosAsc(Long rutaId);

    /** Historial de carreras de una ruta, de la más reciente a la más antigua */
    List<Carrera> findByRutaIdOrderByFechaDesc(Long rutaId);
}
