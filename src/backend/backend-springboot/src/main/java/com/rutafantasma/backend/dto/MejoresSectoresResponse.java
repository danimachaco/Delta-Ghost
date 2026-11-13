package com.rutafantasma.backend.dto;

import java.util.List;

/**
 * Mejores tiempos por sector de una ruta: GET /api/rutas/{id}/sectores/mejores (PS-67)
 * @param sectores           el mejor tiempo de cada sector, en orden
 * @param tiempoIdealSegundos suma de los mejores sectores: la vuelta "perfecta" que nadie ha hecho
 *                           todavía entera, como la vuelta ideal de la F1
 */
public record MejoresSectoresResponse(String rutaId, List<MejorSectorDto> sectores, long tiempoIdealSegundos) {
}
