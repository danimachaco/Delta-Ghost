package com.rutafantasma.desarrollador1.dto;

import java.util.List;

import com.rutafantasma.desarrollador1.model.PuntoGps;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

/** Datos que envía el cliente para crear o actualizar una ruta. */
public record RutaRequest(
        @NotBlank(message = "El nombre es obligatorio") String nombre,
        @NotEmpty(message = "La ruta necesita al menos un punto") List<PuntoGps> puntos) {
}
