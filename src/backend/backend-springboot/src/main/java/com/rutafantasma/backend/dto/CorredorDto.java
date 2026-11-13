package com.rutafantasma.backend.dto;

import com.rutafantasma.backend.modelo.Usuario;

/**
 * Otro corredor tal y como aparece en rankings, mejores sectores y sombras (PS-64).
 * Solo id y nombre: el email de los demás corredores no se enseña (contrato acordado con el frontend, PS-65).
 */
public record CorredorDto(String id, String nombre) {

    public static CorredorDto de(Usuario u) {
        return new CorredorDto(String.valueOf(u.getId()), u.getNombre());
    }
}
