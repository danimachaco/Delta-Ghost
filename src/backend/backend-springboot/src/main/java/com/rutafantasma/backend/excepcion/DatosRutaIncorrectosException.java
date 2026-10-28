package com.rutafantasma.backend.excepcion;

/**
 * Se lanza cuando los datos de una ruta no tienen sentido aunque pasen las validaciones de los DTO
 * (por ejemplo, tiempos que van hacia atrás). GlobalExceptionHandler la convierte en un 400.
 */
public class DatosRutaIncorrectosException extends RuntimeException {

    public DatosRutaIncorrectosException(String mensaje) {
        super(mensaje);
    }
}
