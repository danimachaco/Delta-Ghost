package com.rutafantasma.backend.servicio;

import java.util.ArrayList;
import java.util.List;

import com.rutafantasma.backend.dto.PuntoDto;
import com.rutafantasma.backend.modelo.Punto;
import com.rutafantasma.backend.modelo.Ruta;
import com.rutafantasma.backend.modelo.Sector;

/**
 * Tiempos por sector de un recorrido (se separó de SombraService en PS-67 para reutilizarlo).
 *
 * Los sectores se definen con los puntos de la ruta, pero cada carrera tiene sus propios puntos GPS
 * (pueden ser más o menos y no caer justo en el mismo sitio), así que para cada final de sector se busca
 * el punto del recorrido más cercano. La búsqueda sigue hacia delante desde el sector anterior para que,
 * si la ruta pasa dos veces por el mismo sitio, los tiempos nunca vayan hacia atrás.
 */
public final class TiemposSector {

    /** Radio medio de la Tierra en metros, para la fórmula de Haversine */
    private static final double RADIO_TIERRA = 6_371_000;

    private TiemposSector() {
    }

    /** Segundos desde la salida en los que el recorrido llega al final de cada sector de la ruta, en orden */
    public static List<Long> finales(Ruta ruta, List<PuntoDto> recorrido) {
        List<Long> finales = new ArrayList<>();
        int desde = 0;
        for (Sector s : ruta.getSectores()) {
            Punto fin = ruta.getPuntos().get(s.getPuntoFin());
            int masCercano = desde;
            for (int i = desde; i < recorrido.size(); i++) {
                if (distancia(fin, recorrido.get(i)) < distancia(fin, recorrido.get(masCercano))) {
                    masCercano = i;
                }
            }
            finales.add(recorrido.get(masCercano).tiempoSegundos());
            desde = masCercano;
        }
        return finales;
    }

    /**
     * Segundos que se tardó en cada sector (PS-67): el final de cada uno menos el final del anterior.
     * El primero empieza en el tiempo del primer punto del recorrido (normalmente 0).
     */
    public static List<Long> duraciones(Ruta ruta, List<PuntoDto> recorrido) {
        List<Long> finales = finales(ruta, recorrido);
        List<Long> duraciones = new ArrayList<>();
        long inicio = recorrido.get(0).tiempoSegundos();
        for (long fin : finales) {
            duraciones.add(fin - inicio);
            inicio = fin;
        }
        return duraciones;
    }

    /** Distancia en metros entre dos coordenadas con la fórmula de Haversine (la misma que el servicio Calculo del frontend) */
    private static double distancia(Punto a, PuntoDto b) {
        double dLat = Math.toRadians(b.latitud() - a.getLatitud());
        double dLon = Math.toRadians(b.longitud() - a.getLongitud());
        double h = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(a.getLatitud())) * Math.cos(Math.toRadians(b.latitud()))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return 2 * RADIO_TIERRA * Math.asin(Math.sqrt(h));
    }
}
