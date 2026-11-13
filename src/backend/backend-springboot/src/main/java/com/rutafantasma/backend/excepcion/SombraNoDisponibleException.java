package com.rutafantasma.backend.excepcion;

/**
 * Se lanza al pedir la sombra de un amigo que no lo es, o que todavía no ha corrido la ruta (PS-70).
 * GlobalExceptionHandler la convierte en un 404.
 */
public class SombraNoDisponibleException extends RuntimeException {

    public SombraNoDisponibleException(String mensaje) {
        super(mensaje);
    }
}
