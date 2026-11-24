package com.rutafantasma.backend.controlador;

import java.time.LocalDate;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.rutafantasma.backend.dto.EstadisticasResponse;
import com.rutafantasma.backend.seguridad.TokenInterceptor;
import com.rutafantasma.backend.servicio.EstadisticasService;

/**
 * API REST de estadísticas: GET /api/estadisticas?semanas=12 (PS-75)
 * Necesita el token (ver WebConfig): cada corredor solo ve sus propias estadísticas.
 */
@RestController
public class EstadisticasController {

    private final EstadisticasService servicio;

    public EstadisticasController(EstadisticasService servicio) {
        this.servicio = servicio;
    }

    /** @param semanas cuántas semanas incluir en la serie semanal (entre 1 y 52; 12 por defecto) */
    @GetMapping("/api/estadisticas")
    public EstadisticasResponse estadisticas(@RequestAttribute(TokenInterceptor.USUARIO_ID) Long usuarioId,
            @RequestParam(defaultValue = "" + EstadisticasService.SEMANAS_POR_DEFECTO) int semanas) {
        return servicio.estadisticas(usuarioId, semanas, LocalDate.now());
    }
}
