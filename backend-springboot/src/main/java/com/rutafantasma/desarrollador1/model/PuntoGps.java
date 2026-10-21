package com.rutafantasma.desarrollador1.model;

/**
 * Punto GPS de una ruta.
 * @param latitud        latitud en grados
 * @param longitud       longitud en grados
 * @param tiempoSegundos segundos transcurridos desde el inicio de la carrera
 */
public record
PuntoGps(double latitud, double longitud, long tiempoSegundos) {
}
