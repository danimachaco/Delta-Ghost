package com.rutafantasma.backend.seguridad;

import java.io.IOException;
import java.util.Optional;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import com.rutafantasma.backend.servicio.TokenService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Protege los endpoints privados: se ejecuta ANTES del controlador y comprueba la cabecera
 * `Authorization: Bearer <token>`. Si el token es válido guarda el id del usuario en la petición
 * (atributo "usuarioId") para que el controlador sepa quién llama; si no, responde 401.
 */
@Component
public class TokenInterceptor implements HandlerInterceptor {

    /** Nombre del atributo de la petición donde se guarda el id del usuario */
    public static final String USUARIO_ID = "usuarioId";

    private static final String PREFIJO = "Bearer ";

    private final TokenService tokens;

    public TokenInterceptor(TokenService tokens) {
        this.tokens = tokens;
    }

    @Override
    public boolean preHandle(HttpServletRequest peticion, HttpServletResponse respuesta, Object handler) throws IOException {
        // Las peticiones OPTIONS son la comprobación CORS del navegador y no llevan token
        if ("OPTIONS".equalsIgnoreCase(peticion.getMethod())) {
            return true;
        }

        String cabecera = peticion.getHeader(HttpHeaders.AUTHORIZATION);
        Optional<Long> usuarioId = cabecera != null && cabecera.startsWith(PREFIJO)
                ? tokens.idUsuario(cabecera.substring(PREFIJO.length()).trim())
                : Optional.empty();

        if (usuarioId.isEmpty()) {
            respuesta.setStatus(HttpStatus.UNAUTHORIZED.value());
            respuesta.setContentType(MediaType.APPLICATION_JSON_VALUE);
            respuesta.setCharacterEncoding("UTF-8");
            respuesta.getWriter().write("{\"error\":\"Tienes que iniciar sesión para hacer esto\"}");
            return false;
        }

        peticion.setAttribute(USUARIO_ID, usuarioId.get());
        return true;
    }
}
