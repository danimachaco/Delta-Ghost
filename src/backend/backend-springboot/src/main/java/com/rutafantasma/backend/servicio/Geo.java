package com.rutafantasma.backend.servicio;

import java.util.List;

import com.rutafantasma.backend.dto.PuntoDto;

/**
 * Cálculos de distancia con la fórmula de Haversine, la misma que usa el servicio Calculo del frontend (PS-31).
 * Se sacó a una clase propia en PS-75 para que la usen los sectores y las estadísticas.
 */
public final class Geo {

    /** Radio medio de la Tierra en metros */
    private static final double RADIO_TIERRA = 6_371_000;

    private Geo() {
    }

    /** Distancia en metros entre dos coordenadas (en grados) */
    public static double metros(double lat1, double lon1, double lat2, double lon2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double h = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        // min(1, …) evita errores de redondeo en puntos casi opuestos del planeta
        return 2 * RADIO_TIERRA * Math.asin(Math.min(1, Math.sqrt(h)));
    }

    /** Metros recorridos: suma de los tramos entre puntos consecutivos */
    public static double recorrido(List<PuntoDto> puntos) {
        double total = 0;
        for (int i = 1; i < puntos.size(); i++) {
            PuntoDto a = puntos.get(i - 1);
            PuntoDto b = puntos.get(i);
            total += metros(a.latitud(), a.longitud(), b.latitud(), b.longitud());
        }
        return total;
    }
}
