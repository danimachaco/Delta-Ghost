package com.rutafantasma.desarrollador1.exception;

/** Se lanza cuando no existe la ruta pedida. */
public class RutaNoEncontradaException extends RuntimeException {

    public RutaNoEncontradaException(String id) {
        super("No existe la ruta con id " + id);
    }
}
