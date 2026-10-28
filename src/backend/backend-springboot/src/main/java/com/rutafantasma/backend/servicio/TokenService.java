package com.rutafantasma.backend.servicio;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.Optional;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.rutafantasma.backend.modelo.Usuario;

import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

/**
 * Crea y comprueba los tokens JWT de la sesión.
 * Un JWT es un texto firmado con una clave secreta que lleva dentro el id del usuario
 * y una fecha de caducidad. Si alguien lo modifica, la firma deja de ser válida.
 */
@Service
public class TokenService {

    private final SecretKey clave;
    private final Duration validez;

    public TokenService(@Value("${jwt.secreto}") String secreto, @Value("${jwt.horas-validez}") long horas) {
        // HS256 necesita una clave de al menos 32 bytes; si es más corta, Keys lanza un error al arrancar
        this.clave = Keys.hmacShaKeyFor(secreto.getBytes(StandardCharsets.UTF_8));
        this.validez = Duration.ofHours(horas);
    }

    public String generar(Usuario usuario) {
        Instant ahora = Instant.now();
        return Jwts.builder()
                .subject(String.valueOf(usuario.getId()))
                .claim("email", usuario.getEmail())
                .issuedAt(Date.from(ahora))
                .expiration(Date.from(ahora.plus(validez)))
                .signWith(clave)
                .compact();
    }

    /** Devuelve el id del usuario si el token es válido y no ha caducado; vacío en otro caso. */
    public Optional<Long> idUsuario(String token) {
        try {
            String sujeto = Jwts.parser().verifyWith(clave).build()
                    .parseSignedClaims(token).getPayload().getSubject();
            return Optional.of(Long.valueOf(sujeto));
        } catch (JwtException | IllegalArgumentException e) {
            return Optional.empty();
        }
    }
}
