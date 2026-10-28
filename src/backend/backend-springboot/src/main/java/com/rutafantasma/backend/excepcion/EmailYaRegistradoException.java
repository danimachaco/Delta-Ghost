package com.rutafantasma.backend.excepcion;

/** Se lanza al registrarse con un email que ya tiene cuenta. GlobalExceptionHandler la convierte en un 409. */
public class EmailYaRegistradoException extends RuntimeException {

    public EmailYaRegistradoException() {
        super("Ya existe una cuenta con ese email");
    }
}
