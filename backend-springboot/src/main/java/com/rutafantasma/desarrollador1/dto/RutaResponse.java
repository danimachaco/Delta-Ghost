package com.rutafantasma.desarrollador1.dto;

import java.time.LocalDateTime;
import java.util.List;

import com.rutafantasma.desarrollador1.model.PuntoGps;

/** Datos que devuelve la API al cliente. */
public record RutaResponse(
        String id,
        String nombre,
        LocalDateTime fecha,
        List<PuntoGps> puntos) {
}
