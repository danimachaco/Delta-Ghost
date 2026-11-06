package com.rutafantasma.backend.controlador;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.rutafantasma.backend.dto.AmistadResponse;
import com.rutafantasma.backend.dto.SolicitudAmistadRequest;
import com.rutafantasma.backend.dto.SolicitudesResponse;
import com.rutafantasma.backend.seguridad.TokenInterceptor;
import com.rutafantasma.backend.servicio.AmistadService;

import jakarta.validation.Valid;

/**
 * API REST de amigos: /api/amigos
 * Todas las peticiones necesitan el token (lo comprueba TokenInterceptor, ver WebConfig),
 * que deja el id del usuario en el atributo "usuarioId".
 */
@RestController
@RequestMapping("/api/amigos")
public class AmigoController {

    private final AmistadService servicio;

    public AmigoController(AmistadService servicio) {
        this.servicio = servicio;
    }

    /** Lista de amigos (amistades aceptadas) */
    @GetMapping
    public List<AmistadResponse> amigos(@RequestAttribute(TokenInterceptor.USUARIO_ID) Long usuarioId) {
        return servicio.amigos(usuarioId);
    }

    /** Solicitudes pendientes recibidas y enviadas */
    @GetMapping("/solicitudes")
    public SolicitudesResponse solicitudes(@RequestAttribute(TokenInterceptor.USUARIO_ID) Long usuarioId) {
        return servicio.solicitudes(usuarioId);
    }

    /** Envía una solicitud de amistad al corredor con ese email */
    @PostMapping("/solicitudes")
    @ResponseStatus(HttpStatus.CREATED)
    public AmistadResponse enviar(@RequestAttribute(TokenInterceptor.USUARIO_ID) Long usuarioId,
            @Valid @RequestBody SolicitudAmistadRequest peticion) {
        return servicio.enviar(usuarioId, peticion.email());
    }

    /** Acepta una solicitud recibida */
    @PostMapping("/solicitudes/{id}/aceptar")
    public AmistadResponse aceptar(@RequestAttribute(TokenInterceptor.USUARIO_ID) Long usuarioId, @PathVariable Long id) {
        return servicio.aceptar(usuarioId, id);
    }
}
