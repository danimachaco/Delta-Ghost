package com.rutafantasma.backend.excepcion;

/**
 * Se lanza al enviar una solicitud de amistad a un email que no tiene cuenta. GlobalExceptionHandler la convierte en un 404.
 */
public class UsuarioNoEncontradoException extends RuntimeException {

    public UsuarioNoEncontradoException() {
        super("No hay ningún corredor registrado con ese email");
    }
}
