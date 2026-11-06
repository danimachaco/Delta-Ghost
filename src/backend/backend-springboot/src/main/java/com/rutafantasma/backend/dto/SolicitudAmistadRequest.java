package com.rutafantasma.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/** Datos para enviar una solicitud de amistad: POST /api/amigos/solicitudes */
public record SolicitudAmistadRequest(
        @NotBlank(message = "El email es obligatorio")
        @Email(message = "El email no tiene un formato válido") String email) {
}
