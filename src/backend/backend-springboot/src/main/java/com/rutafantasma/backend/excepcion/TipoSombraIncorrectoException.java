package com.rutafantasma.backend.excepcion;

/**
 * Se lanza al pedir una sombra de un tipo que no existe, o de tipo "amigo" sin decir qué amigo (PS-70).
 * GlobalExceptionHandler la convierte en un 400.
 */
public class TipoSombraIncorrectoException extends RuntimeException {

    public TipoSombraIncorrectoException(String mensaje) {
        super(mensaje);
    }
}
