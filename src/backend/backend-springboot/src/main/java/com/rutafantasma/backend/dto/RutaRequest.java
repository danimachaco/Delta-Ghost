package com.rutafantasma.backend.dto;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Datos para crear una ruta: POST /api/rutas
 * @param numeroSectores en cuántos sectores se divide la ruta (opcional, 3 por defecto, como en la F1)
 */
public record RutaRequest(
        @NotBlank(message = "El nombre es obligatorio")
        @Size(max = 60, message = "El nombre no puede tener más de 60 caracteres") String nombre,
        @NotNull(message = "La ruta necesita puntos")
        @Size(min = 2, message = "La ruta necesita al menos 2 puntos") List<@Valid @NotNull PuntoDto> puntos,
        @Min(value = 1, message = "Tiene que haber al menos 1 sector")
        @Max(value = 10, message = "No puede haber más de 10 sectores") Integer numeroSectores) {

    public static final int SECTORES_POR_DEFECTO = 3;
}
