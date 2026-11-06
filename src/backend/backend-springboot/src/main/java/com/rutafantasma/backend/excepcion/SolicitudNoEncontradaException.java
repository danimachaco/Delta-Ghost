package com.rutafantasma.backend.excepcion;

/**
 * Se lanza al aceptar una solicitud que no existe, que no es para ti o que ya estaba aceptada
 * (se responde igual en todos los casos para no revelar solicitudes ajenas). GlobalExceptionHandler la convierte en un 404.
 */
public class SolicitudNoEncontradaException extends RuntimeException {

    public SolicitudNoEncontradaException(Long id) {
        super("No tienes ninguna solicitud de amistad pendiente con id " + id);
    }
}
