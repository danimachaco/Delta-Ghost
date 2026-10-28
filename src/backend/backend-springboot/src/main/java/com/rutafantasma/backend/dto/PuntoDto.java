package com.rutafantasma.backend.dto;

import com.rutafantasma.backend.modelo.Punto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/**
 * Punto GPS tal y como viaja en el JSON. Mismo formato que el modelo `PuntoGps` del frontend.
 * @param latitud        latitud en grados
 * @param longitud       longitud en grados
 * @param tiempoSegundos segundos transcurridos desde el inicio de la carrera
 */
public record PuntoDto(
        @NotNull(message = "La latitud es obligatoria")
        @DecimalMin(value = "-90", message = "La latitud debe estar entre -90 y 90")
        @DecimalMax(value = "90", message = "La latitud debe estar entre -90 y 90") Double latitud,
        @NotNull(message = "La longitud es obligatoria")
        @DecimalMin(value = "-180", message = "La longitud debe estar entre -180 y 180")
        @DecimalMax(value = "180", message = "La longitud debe estar entre -180 y 180") Double longitud,
        @NotNull(message = "El tiempo es obligatorio")
        @Min(value = 0, message = "El tiempo no puede ser negativo") Long tiempoSegundos) {

    public static PuntoDto de(Punto p) {
        return new PuntoDto(p.getLatitud(), p.getLongitud(), p.getTiempoSegundos());
    }
}
