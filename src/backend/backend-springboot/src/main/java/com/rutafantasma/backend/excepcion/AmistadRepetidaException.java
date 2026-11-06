package com.rutafantasma.backend.excepcion;

/**
 * Se lanza al pedir amistad a alguien que ya es tu amigo o al que ya se la has pedido.
 * GlobalExceptionHandler la convierte en un 409.
 */
public class AmistadRepetidaException extends RuntimeException {

    public AmistadRepetidaException(String mensaje) {
        super(mensaje);
    }
}
