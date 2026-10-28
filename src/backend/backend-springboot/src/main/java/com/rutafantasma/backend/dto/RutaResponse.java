package com.rutafantasma.backend.dto;

import java.time.LocalDateTime;
import java.util.List;

import com.rutafantasma.backend.modelo.Ruta;

/**
 * Ruta tal y como la devuelve la API. Los campos id, nombre, fecha y puntos coinciden
 * con el modelo `Ruta` del frontend; los sectores son un dato extra para el reloj.
 */
public record RutaResponse(
        String id,
        String nombre,
        LocalDateTime fecha,
        List<PuntoDto> puntos,
        List<SectorDto> sectores) {

    public static RutaResponse de(Ruta r) {
        return new RutaResponse(
                String.valueOf(r.getId()),
                r.getNombre(),
                r.getFechaCreacion(),
                r.getPuntos().stream().map(PuntoDto::de).toList(),
                r.getSectores().stream().map(SectorDto::de).toList());
    }
}
