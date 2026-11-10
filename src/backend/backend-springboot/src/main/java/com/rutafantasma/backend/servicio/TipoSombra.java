package com.rutafantasma.backend.servicio;

import java.util.Arrays;
import java.util.Locale;

import com.rutafantasma.backend.excepcion.TipoSombraIncorrectoException;

/**
 * Contra qué sombra se corre (PS-70): GET /api/rutas/{id}/sombra?tipo=…
 * Los tres primeros son el contrato que usa la pantalla "Elige sombra" del reloj (PS-71):
 * <ul>
 * <li>{@code MEJOR}: tu mejor marca en la ruta (la de siempre; es el tipo si no se indica ninguno).</li>
 * <li>{@code ULTIMA}: tu última carrera en la ruta, aunque no sea la mejor.</li>
 * <li>{@code ORIGINAL}: la grabación con la que se creó la ruta.</li>
 * </ul>
 * Y dos más para competir con otros corredores (PS-64):
 * <ul>
 * <li>{@code RECORD}: la mejor marca de todos los corredores de la ruta (el primero del ranking).</li>
 * <li>{@code AMIGO}: la mejor marca de un amigo concreto, indicado con {@code &amigoId=}.</li>
 * </ul>
 */
public enum TipoSombra {
    MEJOR, ULTIMA, ORIGINAL, RECORD, AMIGO;

    /** Convierte el texto de la URL ("ultima", "RECORD"…) en un tipo; sin tipo es MEJOR. Si no existe responde 400. */
    public static TipoSombra desde(String texto) {
        if (texto == null || texto.isBlank()) {
            return MEJOR;
        }
        return Arrays.stream(values())
                .filter(t -> t.name().equals(texto.trim().toUpperCase(Locale.ROOT)))
                .findFirst()
                .orElseThrow(() -> new TipoSombraIncorrectoException(
                        "El tipo de sombra \"" + texto + "\" no existe: usa MEJOR, ULTIMA, ORIGINAL, RECORD o AMIGO"));
    }
}
