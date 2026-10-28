package com.rutafantasma.backend.dto;

import com.rutafantasma.backend.modelo.Usuario;

/**
 * Datos públicos del usuario que devuelve la API (nunca la contraseña).
 * El id se envía como texto porque así lo espera el modelo `Usuario` del frontend.
 */
public record UsuarioResponse(String id, String nombre, String email) {

    public static UsuarioResponse de(Usuario u) {
        return new UsuarioResponse(String.valueOf(u.getId()), u.getNombre(), u.getEmail());
    }
}
