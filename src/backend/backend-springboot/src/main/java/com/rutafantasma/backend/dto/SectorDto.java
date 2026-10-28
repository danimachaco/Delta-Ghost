package com.rutafantasma.backend.dto;

import com.rutafantasma.backend.modelo.Sector;

/** Sector de una ruta en la respuesta: número y orden de sus puntos de inicio y fin. */
public record SectorDto(int numero, int puntoInicio, int puntoFin) {

    public static SectorDto de(Sector s) {
        return new SectorDto(s.getNumero(), s.getPuntoInicio(), s.getPuntoFin());
    }
}
