package com.rutafantasma.backend.dto;

import java.util.List;

/**
 * Ranking de una ruta: GET /api/rutas/{id}/ranking
 * @param puestos la mejor marca de cada corredor, de la más rápida a la más lenta
 */
public record RankingResponse(String rutaId, String nombre, List<PuestoRankingDto> puestos) {
}
