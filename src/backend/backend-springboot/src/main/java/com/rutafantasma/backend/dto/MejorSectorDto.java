package com.rutafantasma.backend.dto;

import java.time.LocalDateTime;

/**
 * El mejor tiempo de un sector entre todos los corredores de la ruta (PS-67).
 * @param tiempoSegundos segundos que se tardó en ESTE sector (no desde la salida)
 * @param usuario        quién lo hizo (solo id y nombre, como en el ranking)
 * @param carreraId      en qué carrera, o null si fue en la grabación original de la ruta
 * @param fecha          cuándo
 * @param tuyo           true si es del usuario que lo pide
 */
public record MejorSectorDto(
        int numero,
        int puntoInicio,
        int puntoFin,
        long tiempoSegundos,
        CorredorDto usuario,
        String carreraId,
        LocalDateTime fecha,
        boolean tuyo) {
}
