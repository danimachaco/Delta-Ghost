package com.rutafantasma.backend.dto;

/**
 * Sector de la ruta en la respuesta de la sombra.
 * @param puntoInicio    orden del punto de la ruta donde empieza
 * @param puntoFin       orden del punto de la ruta donde termina
 * @param tiempoSegundos segundos desde la salida en los que la sombra llega al final del sector
 */
public record SectorSombraDto(int numero, int puntoInicio, int puntoFin, long tiempoSegundos) {
}
