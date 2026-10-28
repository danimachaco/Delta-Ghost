package com.rutafantasma.backend.excepcion;

import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * Convierte las excepciones en respuestas HTTP claras, con el formato que entiende el frontend:
 * { error: "mensaje" } en los errores generales y { campo: "mensaje" } en las validaciones.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(EmailYaRegistradoException.class)
    public ResponseEntity<Map<String, String>> emailRepetido(EmailYaRegistradoException ex) {
        return error(HttpStatus.CONFLICT, ex.getMessage());
    }

    @ExceptionHandler(CredencialesIncorrectasException.class)
    public ResponseEntity<Map<String, String>> credenciales(CredencialesIncorrectasException ex) {
        return error(HttpStatus.UNAUTHORIZED, ex.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> validacion(MethodArgumentNotValidException ex) {
        Map<String, String> errores = ex.getBindingResult().getFieldErrors().stream()
                .collect(Collectors.toMap(e -> e.getField(), e -> String.valueOf(e.getDefaultMessage()), (a, b) -> a));
        return ResponseEntity.badRequest().body(errores);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, String>> jsonIncorrecto(HttpMessageNotReadableException ex) {
        return error(HttpStatus.BAD_REQUEST, "El cuerpo de la petición no es un JSON válido");
    }

    private static ResponseEntity<Map<String, String>> error(HttpStatus estado, String mensaje) {
        return ResponseEntity.status(estado).body(Map.of("error", mensaje));
    }
}
