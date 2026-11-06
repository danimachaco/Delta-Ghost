package com.rutafantasma.backend.excepcion;

/**
 * Se lanza cuando una solicitud de amistad no tiene sentido (por ejemplo, enviártela a ti mismo).
 * GlobalExceptionHandler la convierte en un 400.
 */
public class SolicitudAmistadIncorrectaException extends RuntimeException {

    public SolicitudAmistadIncorrectaException(String mensaje) {
        super(mensaje);
    }
}
