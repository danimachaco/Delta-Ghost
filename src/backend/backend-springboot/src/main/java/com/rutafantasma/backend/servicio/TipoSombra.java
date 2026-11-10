package com.rutafantasma.backend.servicio;

import java.util.Arrays;
import java.util.Locale;

import com.rutafantasma.backend.excepcion.TipoSombraIncorrectoException;

/**
 * Contra quién se corre (PS-70): GET /api/rutas/{id}/sombra/{tipo}
 * <ul>
 * <li>{@code propia}: tu mejor marca en la ruta (o la grabación, si aún no tienes ninguna).</li>
 * <li>{@code record}: la mejor marca de todos los corredores de la ruta (el primero del ranking, PS-64).</li>
 * <li>{@code amigo}: la mejor marca de un amigo concreto, indicado con {@code ?amigoId=}.</li>
 * </ul>
 */
public enum TipoSombra {
    PROPIA, RECORD, AMIGO;

    /** Convierte el texto de la URL ("record", "Amigo"…) en un tipo, o responde 400 si no existe */
    public static TipoSombra desde(String texto) {
        return Arrays.stream(values())
                .filter(t -> t.name().equals(texto.trim().toUpperCase(Locale.ROOT)))
                .findFirst()
                .orElseThrow(() -> new TipoSombraIncorrectoException(
                        "El tipo de sombra \"" + texto + "\" no existe: usa propia, record o amigo"));
    }

    /** Nombre en minúsculas, igual que en la URL */
    public String texto() {
        return name().toLowerCase(Locale.ROOT);
    }
}
