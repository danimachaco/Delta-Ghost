package com.rutafantasma.backend.dto;

import java.time.LocalDateTime;

/**
 * Un puesto del ranking de una ruta: la mejor marca de un corredor.
 * Los campos posicion, usuario, tiempoTotalSegundos y fecha son los del modelo `EntradaRanking` del frontend (PS-65).
 * @param posicion        1, 2, 3… (dos corredores con el mismo tiempo comparten puesto)
 * @param carreraId       carrera de esa marca, o null si es la grabación original de la ruta
 * @param diferenciaConPrimeroSegundos segundos que le faltan para igualar al primero (0 si es el primero)
 * @param tuya            true si es la marca del usuario que pide el ranking
 */
public record PuestoRankingDto(
        int posicion,
        CorredorDto usuario,
        long tiempoTotalSegundos,
        String carreraId,
        LocalDateTime fecha,
        long diferenciaConPrimeroSegundos,
        boolean tuya) {
}
