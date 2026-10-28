package com.rutafantasma.backend.excepcion;

/**
 * Se lanza cuando la ruta pedida no existe o es de otro usuario (se responde igual en los dos casos
 * para no revelar rutas ajenas). GlobalExceptionHandler la convierte en un 404.
 */
public class RutaNoEncontradaException extends RuntimeException {

    public RutaNoEncontradaException(Long id) {
        super("No existe la ruta con id " + id);
    }
}
