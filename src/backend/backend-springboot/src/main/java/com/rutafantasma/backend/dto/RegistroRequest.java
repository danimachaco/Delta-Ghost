package com.rutafantasma.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Datos que envía el formulario de registro: POST /api/auth/registro */
public record RegistroRequest(
        @NotBlank(message = "El nombre es obligatorio")
        @Size(max = 40, message = "El nombre no puede tener más de 40 caracteres") String nombre,
        @NotBlank(message = "El email es obligatorio")
        @Email(message = "El email no tiene un formato válido")
        @Size(max = 100, message = "El email no puede tener más de 100 caracteres") String email,
        @NotBlank(message = "La contraseña es obligatoria")
        @Size(min = 6, max = 72, message = "La contraseña debe tener entre 6 y 72 caracteres") String password) {
}
