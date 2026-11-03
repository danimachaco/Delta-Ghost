package com.rutafantasma.backend.dto;

import java.util.List;

/**
 * Sombra de una ruta tal y como la descarga el reloj: GET /api/rutas/{id}/sombra
 * @param carreraId id de la carrera que es la mejor marca, o null si la sombra es todavía la grabación de la ruta
 * @param puntos    puntos que recorre la sombra, con sus tiempos
 * @param sectores  sectores de la ruta con el tiempo de la sombra al terminar cada uno (para los avisos verde/rojo)
 */
public record SombraResponse(
        String rutaId,
        String carreraId,
        long tiempoTotalSegundos,
        List<PuntoDto> puntos,
        List<SectorSombraDto> sectores) {
}
