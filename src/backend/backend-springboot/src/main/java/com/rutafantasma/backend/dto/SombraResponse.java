package com.rutafantasma.backend.dto;

import java.util.List;

/**
 * Sombra de una ruta tal y como la descarga el reloj: GET /api/rutas/{id}/sombra?tipo=… (PS-36 y PS-70)
 * @param carreraId id de la carrera de la sombra, o null si la sombra es la grabación de la ruta
 * @param tipo      MEJOR, ULTIMA, ORIGINAL, RECORD o AMIGO: el tipo de sombra devuelto (PS-70)
 * @param usuario   de quién es la sombra, solo id y nombre (PS-70)
 * @param puntos    puntos que recorre la sombra, con sus tiempos
 * @param sectores  sectores de la ruta con el tiempo de la sombra al terminar cada uno (para los avisos verde/rojo)
 */
public record SombraResponse(
        String rutaId,
        String carreraId,
        String tipo,
        CorredorDto usuario,
        long tiempoTotalSegundos,
        List<PuntoDto> puntos,
        List<SectorSombraDto> sectores) {
}
