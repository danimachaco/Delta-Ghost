package com.rutafantasma.backend.dto;

/**
 * Respuesta al registrarse o iniciar sesión: { token, usuario }.
 * El cliente envía después el token en la cabecera `Authorization: Bearer <token>`.
 */
public record AuthResponse(String token, UsuarioResponse usuario) {
}
