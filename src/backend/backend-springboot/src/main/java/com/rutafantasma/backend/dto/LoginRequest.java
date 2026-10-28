package com.rutafantasma.backend.dto;

import jakarta.validation.constraints.NotBlank;

/** Datos que envía el formulario de inicio de sesión: POST /api/auth/login */
public record LoginRequest(
        @NotBlank(message = "El email es obligatorio") String email,
        @NotBlank(message = "La contraseña es obligatoria") String password) {
}
