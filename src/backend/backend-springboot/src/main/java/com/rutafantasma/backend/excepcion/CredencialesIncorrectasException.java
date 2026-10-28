package com.rutafantasma.backend.excepcion;

/**
 * Se lanza cuando el login falla. El mensaje es el mismo si el email no existe o si la contraseña
 * es incorrecta, para no revelar qué emails están registrados. GlobalExceptionHandler la convierte en un 401.
 */
public class CredencialesIncorrectasException extends RuntimeException {

    public CredencialesIncorrectasException() {
        super("El email o la contraseña no son correctos");
    }
}
