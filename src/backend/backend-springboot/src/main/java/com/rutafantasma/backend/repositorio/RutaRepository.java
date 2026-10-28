package com.rutafantasma.backend.repositorio;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.rutafantasma.backend.modelo.Ruta;

/** Acceso a la tabla "ruta". Los puntos y sectores se guardan junto con la ruta (en cascada). */
public interface RutaRepository extends JpaRepository<Ruta, Long> {

    List<Ruta> findByUsuarioIdOrderByFechaCreacionDesc(Long usuarioId);
}
