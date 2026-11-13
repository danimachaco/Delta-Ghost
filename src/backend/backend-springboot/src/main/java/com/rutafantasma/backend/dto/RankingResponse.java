package com.rutafantasma.backend.dto;

import java.util.List;

/**
 * Ranking de una ruta: GET /api/rutas/{id}/ranking
 * Mismos nombres que el modelo `RankingRuta` del frontend (PS-65).
 * @param entradas la mejor marca de cada corredor, de la más rápida a la más lenta
 */
public record RankingResponse(String rutaId, String rutaNombre, List<PuestoRankingDto> entradas) {
}
