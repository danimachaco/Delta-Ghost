package com.rutafantasma.backend.dto;

import java.time.LocalDateTime;

import com.rutafantasma.backend.modelo.Amistad;

/**
 * Una amistad o solicitud vista por el usuario que llama.
 * @param id      id de la amistad (el que se usa para aceptar la solicitud)
 * @param usuario la OTRA persona: el amigo, quien te envió la solicitud o a quien se la enviaste
 * @param estado  "PENDIENTE" o "ACEPTADA"
 * @param fecha   cuándo se envió la solicitud, o cuándo se aceptó si ya sois amigos
 */
public record AmistadResponse(String id, UsuarioResponse usuario, String estado, LocalDateTime fecha) {

    public static AmistadResponse de(Amistad a, Long usuarioId) {
        boolean aceptada = a.getEstado() == Amistad.Estado.ACEPTADA;
        return new AmistadResponse(
                String.valueOf(a.getId()),
                UsuarioResponse.de(a.otro(usuarioId)),
                a.getEstado().name(),
                aceptada ? a.getFechaAceptada() : a.getFechaSolicitud());
    }
}
