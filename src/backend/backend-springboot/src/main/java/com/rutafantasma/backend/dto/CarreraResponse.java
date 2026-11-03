package com.rutafantasma.backend.dto;

import java.time.LocalDateTime;
import java.util.List;

import com.rutafantasma.backend.modelo.Carrera;

/**
 * Carrera tal y como la devuelve la API.
 * @param mejorMarca true si esta carrera es ahora la sombra de la ruta
 */
public record CarreraResponse(
        String id,
        String rutaId,
        LocalDateTime fecha,
        long tiempoTotalSegundos,
        boolean mejorMarca,
        List<PuntoDto> puntos) {

    public static CarreraResponse de(Carrera c) {
        return new CarreraResponse(
                String.valueOf(c.getId()),
                String.valueOf(c.getRuta().getId()),
                c.getFecha(),
                c.getTiempoTotalSegundos(),
                c.isMejorMarca(),
                c.getPuntos().stream().map(PuntoDto::de).toList());
    }
}
