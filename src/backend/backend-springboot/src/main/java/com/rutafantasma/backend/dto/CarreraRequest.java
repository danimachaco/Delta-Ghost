package com.rutafantasma.backend.dto;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Datos para subir una carrera: POST /api/rutas/{id}/carreras
 * @param puntos puntos GPS grabados durante la carrera, en orden. El tiempo del último es el tiempo total.
 */
public record CarreraRequest(
        @NotNull(message = "La carrera necesita puntos")
        @Size(min = 2, message = "La carrera necesita al menos 2 puntos") List<@Valid @NotNull PuntoDto> puntos) {
}
