package com.rutafantasma.backend.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Estadísticas del corredor: GET /api/estadisticas (PS-75). Pensado para la web de estadísticas
 * con Chart.js (PS-76): cada lista es una serie lista para dibujar, sin cálculos en el frontend.
 * Una "carrera" es cada vez que has corrido: tus carreras y la grabación de tus rutas (como en el ranking).
 * Las distancias van en metros, los tiempos en segundos y los ritmos en segundos por km.
 *
 * @param resumen   totales para las tarjetas de arriba
 * @param semanas   las últimas semanas, de la más antigua a la actual, también las que no corriste (gráfico de barras)
 * @param rutas     una fila por ruta que has corrido (tabla o gráfico de barras horizontales)
 * @param evolucion tus últimas carreras en orden de fecha (gráfico de líneas del ritmo)
 */
public record EstadisticasResponse(Resumen resumen, List<Semana> semanas, List<PorRuta> rutas, List<Evolucion> evolucion) {

    /**
     * @param ritmoMedioSegundosKm tiempo total entre distancia total; null si aún no has corrido
     * @param mejorRitmoSegundosKm el ritmo de tu carrera más rápida por km; null si aún no has corrido
     */
    public record Resumen(
            int carreras,
            int rutasCorridas,
            long distanciaTotalMetros,
            long tiempoTotalSegundos,
            Long ritmoMedioSegundosKm,
            Long mejorRitmoSegundosKm,
            long carreraMasLargaMetros) {
    }

    /** @param inicio lunes de esa semana */
    public record Semana(LocalDate inicio, int carreras, long distanciaMetros, long tiempoSegundos) {
    }

    /** @param mejoraSegundos cuánto has bajado desde la primera vez (primer tiempo − mejor tiempo) */
    public record PorRuta(
            String rutaId,
            String nombre,
            int carreras,
            long primerTiempoSegundos,
            long mejorTiempoSegundos,
            long ultimoTiempoSegundos,
            long mejoraSegundos) {
    }

    /** @param carreraId null si es la grabación de la ruta */
    public record Evolucion(
            String carreraId,
            String rutaId,
            String rutaNombre,
            LocalDateTime fecha,
            long tiempoTotalSegundos,
            long distanciaMetros,
            Long ritmoSegundosKm) {
    }
}
